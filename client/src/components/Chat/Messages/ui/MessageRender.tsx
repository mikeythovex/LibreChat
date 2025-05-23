import { useRecoilValue } from 'recoil';
import { useCallback, useMemo, memo } from 'react';
import type { TMessage } from 'librechat-data-provider';
import type { TMessageProps, TMessageIcon } from '~/common';
import MessageContent from '~/components/Chat/Messages/Content/MessageContent';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';
import MessageIcon from '~/components/Chat/Messages/MessageIcon';
import { Plugin } from '~/components/Messages/Content';
import SubRow from '~/components/Chat/Messages/SubRow';
import { MessageContext } from '~/Providers';
import { useMessageActions } from '~/hooks';
import { cn, logger } from '~/utils';
import store from '~/store';
import { useMediaQuery } from '~/hooks';
import { CircleUser, Bot } from 'lucide-react';

type MessageRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

const MessageRender = memo(
  ({
    message: msg,
    isCard = false,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
    currentEditId,
    isMultiMessage = false,
    setCurrentEditId,
    isSubmittingFamily = false,
  }: MessageRenderProps) => {
    const {
      ask,
      edit,
      index,
      agent,
      assistant,
      enterEdit,
      conversation,
      messageLabel,
      isSubmitting,
      latestMessage,
      handleContinue,
      copyToClipboard,
      setLatestMessage,
      regenerateMessage,
    } = useMessageActions({
      message: msg,
      currentEditId,
      isMultiMessage,
      setCurrentEditId,
    });

    const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
    const fontSize = useRecoilValue(store.fontSize);

    const handleRegenerateMessage = useCallback(() => regenerateMessage(), [regenerateMessage]);
    const hasNoChildren = !(msg?.children?.length ?? 0);
    const isLast = useMemo(
      () => hasNoChildren && (msg?.depth === latestMessage?.depth || msg?.depth === -1),
      [hasNoChildren, msg?.depth, latestMessage?.depth],
    );
    const isLatestMessage = msg?.messageId === latestMessage?.messageId;
    const showCardRender = isLast && !isSubmittingFamily && isCard;
    const isLatestCard = isCard && !isSubmittingFamily && isLatestMessage;

    const iconData: TMessageIcon = useMemo(
      () => ({
        endpoint: msg?.endpoint ?? conversation?.endpoint,
        model: msg?.model ?? conversation?.model,
        iconURL: '/assets/bmo-128x128.png',
        modelLabel: 'BMO',
        isCreatedByUser: msg?.isCreatedByUser,
      }),
      [
        messageLabel,
        conversation?.endpoint,
        conversation?.model,
        msg?.model,
        msg?.iconURL,
        msg?.endpoint,
        msg?.isCreatedByUser,
      ],
    );

    const clickHandler = useMemo(
      () =>
        showCardRender && !isLatestMessage
          ? () => {
            logger.log(`Message Card click: Setting ${msg?.messageId} as latest message`);
            logger.dir(msg);
            setLatestMessage(msg!);
          }
          : undefined,
      [showCardRender, isLatestMessage, msg, setLatestMessage],
    );

    if (!msg) {
      return null;
    }

    const baseClasses = {
      common: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu ',
      card: 'relative w-full gap-1 rounded-lg border border-border-medium bg-surface-primary-alt p-2 md:w-1/2 md:gap-3 md:p-4',
      chat: maximizeChatSpace
        ? 'w-full max-w-full md:px-5 lg:px-1 xl:px-5'
        : 'md:max-w-[45rem] xl:max-w-[53rem]',
    };

    const conditionalClasses = {
      latestCard: isLatestCard ? 'bg-surface-secondary' : '',
      cardRender: showCardRender ? 'cursor-pointer transition-colors duration-300' : '',
      focus: 'focus:outline-none focus:ring-2 focus:ring-border-xheavy',
    };

    const isSmallScreen = useMediaQuery('(max-width: 768px)');

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          baseClasses.common,
          isCard ? baseClasses.card : baseClasses.chat,
          conditionalClasses.latestCard,
          conditionalClasses.cardRender,
          conditionalClasses.focus,
          'message-render',
        )}
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
      >
        {isLatestCard && (
          <div className="absolute right-0 top-0 m-2 h-3 w-3 rounded-full bg-text-primary" />
        )}

        {/* <div className="relative flex flex-shrink-0 flex-col items-center">
          <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
            <MessageIcon iconData={iconData} assistant={assistant} agent={agent} />
          </div>
        </div> */}

        <div
          className={cn(
            'relative flex flex-col w-full break-words',
            msg.isCreatedByUser ? 'user-turn' : 'agent-turn',
          )}
        >
          <div className="flex items-center gap-1 mb-1">
            {msg.isCreatedByUser ? (
              <CircleUser className="icon-md mr-0.5" />
            ) : (
              <Bot className="icon-md mr-0.5" />
            )}
            <h2 className={cn('select-none font-semibold', fontSize)}>
              {msg.isCreatedByUser ? 'You' : 'BMO'}
            </h2>
          </div>

          <div className={cn("message-render flex flex-col gap-1 w-full", 
            // isSmallScreen ? '-ml-6 w-[calc(100vw-2rem)]' : '',
          )}>
            <div className="flex max-w-full flex-grow flex-col gap-0">
              <MessageContext.Provider
                value={{
                  messageId: msg.messageId,
                  conversationId: conversation?.conversationId,
                  isExpanded: false,
                }}
              >
                {msg.plugin && <Plugin plugin={msg.plugin} />}
                <MessageContent
                  ask={ask}
                  edit={edit}
                  isLast={isLast}
                  text={msg.text || ''}
                  message={msg}
                  enterEdit={enterEdit}
                  error={!!(msg.error ?? false)}
                  isSubmitting={isSubmitting}
                  unfinished={msg.unfinished ?? false}
                  isCreatedByUser={msg.isCreatedByUser ?? true}
                  siblingIdx={siblingIdx ?? 0}
                  setSiblingIdx={setSiblingIdx ?? (() => ({}))}
                />
              </MessageContext.Provider>
            </div>

            {hasNoChildren && (isSubmittingFamily === true || isSubmitting) ? (
              <PlaceholderRow isCard={isCard} />
            ) : (
              <SubRow classes="text-xs">
              <SiblingSwitch
                siblingIdx={siblingIdx}
                siblingCount={siblingCount}
                setSiblingIdx={setSiblingIdx}
              />
              {!msg.isCreatedByUser && (
                <HoverButtons
                index={index}
                isEditing={edit}
                message={msg}
                enterEdit={enterEdit}
                isSubmitting={isSubmitting}
                conversation={conversation ?? null}
                regenerate={handleRegenerateMessage}
                copyToClipboard={copyToClipboard}
                handleContinue={handleContinue}
                latestMessage={latestMessage}
                isLast={isLast}
                />
              )}
              </SubRow>
            )}
          </div>
        </div>
      </div>
    );
  },
);

export default MessageRender;
