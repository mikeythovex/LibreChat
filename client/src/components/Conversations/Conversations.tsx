import { useMemo, memo, type FC, useCallback } from 'react';
import throttle from 'lodash/throttle';
import { parseISO, isToday } from 'date-fns';
import { List, AutoSizer, CellMeasurer, CellMeasurerCache } from 'react-virtualized';
import { useLocalize, TranslationKeys, useMediaQuery } from '~/hooks';
import { TConversation } from 'librechat-data-provider';
import { groupConversationsByDate } from '~/utils';
import { Spinner } from '~/components/svg';
import Convo from './Convo';

interface ConversationsProps {
  conversations: Array<TConversation | null>;
  moveToTop: () => void;
  toggleNav: () => void;
  containerRef: React.RefObject<HTMLDivElement | List>;
  loadMoreConversations: () => void;
  isLoading: boolean;
  isSearchLoading: boolean;
}

const LoadingSpinner = memo(() => {
  const localize = useLocalize();

  return (
    <div className="mx-auto mt-2 flex items-center justify-center gap-2">
      <Spinner className="h-4 w-4 text-text-primary" />
      <span className="animate-pulse text-text-primary">{localize('com_ui_loading')}</span>
    </div>
  );
});

const DateLabel: FC<{ groupName: string }> = memo(({ groupName }) => {
  const localize = useLocalize();
  return (
    <div
      className="mt-2 pl-2 pt-1 text-text-secondary cursor-default"
      style={{ fontSize: '0.75rem', fontWeight: '500' }}
    >
      {localize(groupName as TranslationKeys) || groupName}
    </div>
  );
});

DateLabel.displayName = 'DateLabel';

type FlattenedItem =
  | { type: 'header'; groupName: string }
  | { type: 'convo'; convo: TConversation }
  | { type: 'loading' };

const MemoizedConvo = memo(
  ({
    conversation,
    retainView,
    toggleNav,
    isLatestConvo,
  }: {
    conversation: TConversation;
    retainView: () => void;
    toggleNav: () => void;
    isLatestConvo: boolean;
  }) => {
    return (
      <Convo
        conversation={conversation}
        retainView={retainView}
        toggleNav={toggleNav}
        isLatestConvo={isLatestConvo}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.conversation.conversationId === nextProps.conversation.conversationId &&
      prevProps.conversation.title === nextProps.conversation.title &&
      prevProps.isLatestConvo === nextProps.isLatestConvo &&
      prevProps.conversation.endpoint === nextProps.conversation.endpoint
    );
  },
);

const Conversations: FC<ConversationsProps> = ({
  conversations: rawConversations,
  moveToTop,
  toggleNav,
  containerRef,
  loadMoreConversations,
  isLoading,
  isSearchLoading,
}) => {
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const convoHeight = isSmallScreen ? 44 : 34;

  const filteredConversations = useMemo(
    () => rawConversations.filter(Boolean) as TConversation[],
    [rawConversations],
  );

  const groupedConversations = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations],
  );

  const firstTodayConvoId = useMemo(
    () =>
      filteredConversations.find((convo) => convo.updatedAt && isToday(parseISO(convo.updatedAt)))
        ?.conversationId ?? undefined,
    [filteredConversations],
  );

  const flattenedItems = useMemo(() => {
    const items: FlattenedItem[] = [];
    groupedConversations.forEach(([groupName, convos]) => {
      items.push({ type: 'header', groupName });
      items.push(...convos.map((convo) => ({ type: 'convo' as const, convo })));
    });

    if (isLoading) {
      items.push({ type: 'loading' } as any);
    }
    return items;
  }, [groupedConversations, isLoading]);

  const cache = useMemo(
    () =>
      new CellMeasurerCache({
        fixedWidth: true,
        defaultHeight: convoHeight,
        keyMapper: (index) => {
          const item = flattenedItems[index];
          if (item.type === 'header') {
            return `header-${index}`;
          }
          if (item.type === 'convo') {
            return `convo-${item.convo.conversationId}`;
          }
          if (item.type === 'loading') {
            return `loading-${index}`;
          }
          return `unknown-${index}`;
        },
      }),
    [flattenedItems, convoHeight],
  );

  const rowRenderer = useCallback(
    ({ index, key, parent, style }) => {
      const item = flattenedItems[index];
      if (item.type === 'loading') {
        return (
          <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
            {({ registerChild }) => (
              <div ref={registerChild} style={style}>
                <LoadingSpinner />
              </div>
            )}
          </CellMeasurer>
        );
      }
      return (
        <CellMeasurer cache={cache} columnIndex={0} key={key} parent={parent} rowIndex={index}>
          {({ registerChild }) => (
            <div ref={registerChild} style={style} className="touch-manipulation">
              {item.type === 'header' ? (
                <DateLabel groupName={item.groupName} />
              ) : item.type === 'convo' ? (
                <MemoizedConvo
                  conversation={item.convo}
                  retainView={moveToTop}
                  toggleNav={toggleNav}
                  isLatestConvo={item.convo.conversationId === firstTodayConvoId}
                />
              ) : null}
            </div>
          )}
        </CellMeasurer>
      );
    },
    [cache, flattenedItems, firstTodayConvoId, moveToTop, toggleNav],
  );

  const getRowHeight = useCallback(
    ({ index }: { index: number }) => cache.getHeight(index, 0),
    [cache],
  );

  const throttledLoadMore = useMemo(
    () => throttle(loadMoreConversations, 300),
    [loadMoreConversations],
  );

  const handleRowsRendered = useCallback(
    ({ stopIndex }: { stopIndex: number }) => {
      if (stopIndex >= flattenedItems.length - 8) {
        throttledLoadMore();
      }
    },
    [flattenedItems.length, throttledLoadMore],
  );

  return (
    <div className="scrollbar-transparent relative flex h-full flex-col gap-2 pb-2 text-sm text-text-primary">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-6 bg-gradient-to-b from-[#f5f4ee] to-transparent dark:h-4 dark:from-[#1A1A18]"
        style={{ position: 'absolute' }}
      ></div>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-10 bg-gradient-to-t from-[#f5f4ee] to-transparent dark:h-6 dark:from-[#1A1A18]"></div>
      {isSearchLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-text-primary" />
          <span className="ml-2 text-text-primary">Loading...</span>
        </div>
      ) : (
        <div className="scrollbar-transparent flex-1 pl-2">
          <AutoSizer>
            {({ width, height }) => (
              <List
                ref={containerRef as React.RefObject<List>}
                width={width}
                height={height}
                deferredMeasurementCache={cache}
                rowCount={flattenedItems.length}
                rowHeight={getRowHeight}
                rowRenderer={rowRenderer}
                overscanRowCount={10}
                className="touch-manipulation outline-none"
                style={{ outline: 'none' }}
                role="list"
                aria-label="Conversations"
                onRowsRendered={handleRowsRendered}
              />
            )}
          </AutoSizer>
        </div>
      )}
    </div>
  );
};

export default memo(Conversations);
