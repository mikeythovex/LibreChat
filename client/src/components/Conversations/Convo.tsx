import type { TConversation } from 'librechat-data-provider';
import { Constants } from 'librechat-data-provider';
import { Check, X } from 'lucide-react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { NotificationSeverity } from '~/common';
import { useGetEndpointsQuery, useUpdateConversationMutation } from '~/data-provider';
import { useLocalize, useMediaQuery, useNavigateToConvo } from '~/hooks';
import { useToastContext } from '~/Providers';
import store from '~/store';
import { cn } from '~/utils';
import { ConvoOptions } from './ConvoOptions';

type KeyEvent = KeyboardEvent<HTMLInputElement>;

type ConversationProps = {
  conversation: TConversation;
  retainView: () => void;
  toggleNav: () => void;
  isLatestConvo: boolean;
};

export default function Conversation({
  conversation,
  retainView,
  toggleNav,
  isLatestConvo,
}: ConversationProps) {
  const params = useParams();
  const currentConvoId = useMemo(() => params.conversationId, [params.conversationId]);
  const updateConvoMutation = useUpdateConversationMutation(currentConvoId ?? '');
  const activeConvos = useRecoilValue(store.allConversationsSelector);
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { navigateWithLastTools } = useNavigateToConvo();
  const { showToast } = useToastContext();
  const { conversationId, title } = conversation;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [titleInput, setTitleInput] = useState(title);
  const [renaming, setRenaming] = useState(false);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const localize = useLocalize();

  const clickHandler = async (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button === 0 && (event.ctrlKey || event.metaKey)) {
      toggleNav();
      return;
    }

    event.preventDefault();

    if (currentConvoId === conversationId || isPopoverActive) {
      return;
    }

    toggleNav();

    // set document title
    if (typeof title === 'string' && title.length > 0) {
      document.title = title;
    }
    /* Note: Latest Message should not be reset if existing convo */
    navigateWithLastTools(
      conversation,
      !(conversationId ?? '') || conversationId === Constants.NEW_CONVO,
    );
  };

  const renameHandler = useCallback(() => {
    setIsPopoverActive(false);
    setTitleInput(title);
    setRenaming(true);
  }, [title]);

  useEffect(() => {
    if (renaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renaming]);

  const onRename = useCallback(
    (e: MouseEvent<HTMLButtonElement> | FocusEvent<HTMLInputElement> | KeyEvent) => {
      e.preventDefault();
      setRenaming(false);
      if (titleInput === title) {
        return;
      }
      if (typeof conversationId !== 'string' || conversationId === '') {
        return;
      }

      updateConvoMutation.mutate(
        { conversationId, title: titleInput ?? '' },
        {
          onError: () => {
            setTitleInput(title);
            showToast({
              message: 'Failed to rename conversation',
              severity: NotificationSeverity.ERROR,
              showIcon: true,
            });
          },
        },
      );
    },
    [title, titleInput, conversationId, showToast, updateConvoMutation],
  );

  const handleKeyDown = useCallback(
    (e: KeyEvent) => {
      if (e.key === 'Escape') {
        setTitleInput(title);
        setRenaming(false);
      } else if (e.key === 'Enter') {
        onRename(e);
      }
    },
    [title, onRename],
  );

  const cancelRename = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setTitleInput(title);
      setRenaming(false);
    },
    [title],
  );

  const isActiveConvo: boolean = useMemo(
    () =>
      currentConvoId === conversationId ||
      (isLatestConvo &&
        currentConvoId === 'new' &&
        activeConvos[0] != null &&
        activeConvos[0] !== 'new'),
    [currentConvoId, conversationId, isLatestConvo, activeConvos],
  );

  return (
    <div
      className={cn(
        'group relative mt-1 flex h-7 w-full items-center rounded-lg bg-beigesecondary dark:bg-darkbeige  hover:bg-beigetertiary hover:dark:bg-darkbeige800',
        isActiveConvo ? 'bg-beigetertiary dark:bg-darkbeige800' : '',
        isSmallScreen ? 'h-12' : '',
      )}
    >
      {renaming ? (
        <div className="absolute inset-0 z-20 flex w-full items-center rounded-lg bg-beigetertiary dark:bg-claudeblack p-1.5">
          <input
            ref={inputRef}
            type="text"
            className="w-full rounded bg-transparent p-0.5 text-sm leading-tight focus-visible:outline-none"
            value={titleInput ?? ''}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label={`${localize('com_ui_rename')} ${localize('com_ui_chat')}`}
          />
          <div className="flex gap-1">
            <button
              onClick={cancelRename}
              aria-label={`${localize('com_ui_cancel')} ${localize('com_ui_rename')}`}
            >
              <X
                aria-hidden={true}
                className="h-4 w-4 transition-colors duration-200 ease-in-out hover:opacity-70"
              />
            </button>
            <button
              onClick={onRename}
              aria-label={`${localize('com_ui_submit')} ${localize('com_ui_rename')}`}
            >
              <Check
                aria-hidden={true}
                className="h-4 w-4 transition-colors duration-200 ease-in-out hover:opacity-70"
              />
            </button>
          </div>
        </div>
      ) : (
        <a
          href={`/c/${conversationId}`}
          data-testid="convo-item"
          onClick={clickHandler}
          className={cn(
            'flex grow cursor-pointer items-center gap-2 overflow-hidden whitespace-nowrap break-all rounded-lg px-2 py-1',
            isActiveConvo ? 'bg-beigetertiary dark:bg-darkbeige800 hover:dark:bg-darkbeige800' : '',
          )}
          title={title ?? ''}
        >
          <div
            className="relative line-clamp-1 flex-1 grow overflow-hidden"
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setTitleInput(title);
              setRenaming(true);
            }}
          >
            {title}
          </div>
          {isActiveConvo ? (
            <div className="absolute bottom-0 right-0 top-0 w-20 rounded-r-lg " />
          ) : (
            <div className="absolute bottom-0 right-0 top-0 w-20 rounded-r-lg" />
          )}
        </a>
      )}
      <div
        className={cn(
          'mr-2',
          isPopoverActive || isActiveConvo
            ? 'flex'
            : 'hidden group-focus-within:flex group-hover:flex',
        )}
      >
        {!renaming && (
          <ConvoOptions
            title={title}
            retainView={retainView}
            renameHandler={renameHandler}
            isActiveConvo={isActiveConvo}
            conversationId={conversationId}
            isPopoverActive={isPopoverActive}
            setIsPopoverActive={setIsPopoverActive}
          />
        )}
      </div>
    </div>
  );
}
