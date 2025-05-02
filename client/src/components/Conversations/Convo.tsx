import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { Constants } from 'librechat-data-provider';
import type { TConversation } from 'librechat-data-provider';
import { useNavigateToConvo, useMediaQuery, useLocalize } from '~/hooks';
import { useUpdateConversationMutation } from '~/data-provider';
import EndpointIcon from '~/components/Endpoints/EndpointIcon';
import { useGetEndpointsQuery } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { ConvoOptions } from './ConvoOptions';
import { useToastContext } from '~/Providers';
import RenameForm from './RenameForm';
import { cn } from '~/utils';
import store from '~/store';
import ConvoLink from './ConvoLink';


// A threshold in pixels to differentiate between a tap and a scroll/drag
const SCROLL_THRESHOLD = 10; // Adjust as needed

interface ConversationProps {
  conversation: TConversation;
  retainView: () => void;
  toggleNav: () => void;
  isLatestConvo: boolean;
}

export default function Conversation({
  conversation,
  retainView,
  toggleNav,
  isLatestConvo,
}: ConversationProps) {
  const params = useParams();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { navigateToConvo } = useNavigateToConvo();
  const currentConvoId = useMemo(() => params.conversationId, [params.conversationId]);
  const updateConvoMutation = useUpdateConversationMutation(currentConvoId ?? '');
  const activeConvos = useRecoilValue(store.allConversationsSelector);
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { conversationId, title = '' } = conversation;

  const [titleInput, setTitleInput] = useState(title || '');
  const [renaming, setRenaming] = useState(false);
  const [isPopoverActive, setIsPopoverActive] = useState(false);

  // Refs for touch handling
  const touchStartPos = useRef({ x: null as number | null, y: null as number | null });
  const didMove = useRef(false);

  const previousTitle = useRef(title);

  useEffect(() => {
    if (title !== previousTitle.current) {
      setTitleInput(title as string);
      previousTitle.current = title;
    }
  }, [title]);

  const isActiveConvo = useMemo(() => {
    if (conversationId === Constants.NEW_CONVO) {
      return currentConvoId === Constants.NEW_CONVO;
    }

    if (currentConvoId !== Constants.NEW_CONVO) {
      return currentConvoId === conversationId;
    } else {
      // Assuming activeConvos is sorted with the latest first
      const latestConvoId = activeConvos?.[0];
      // Match against the specific ID, not the whole object comparison
      return latestConvoId === conversationId;
    }
  }, [currentConvoId, conversationId, activeConvos]);

  const handleRename = () => {
    setIsPopoverActive(false);
    setTitleInput(title as string);
    setRenaming(true);
  };

  const handleRenameSubmit = async (newTitle: string) => {
    if (!conversationId || newTitle === title) {
      setRenaming(false);
      return;
    }

    try {
      await updateConvoMutation.mutateAsync({
        conversationId,
        title: newTitle.trim() || localize('com_ui_untitled'),
      });
      setRenaming(false);
    } catch (error) {
      setTitleInput(title as string);
      showToast({
        message: localize('com_ui_rename_failed'),
        severity: NotificationSeverity.ERROR,
        showIcon: true,
      });
      setRenaming(false);
    }
  };

  const handleCancelRename = () => {
    setTitleInput(title as string);
    setRenaming(false);
  };

  const handleNavigation = useCallback(
    (ctrlOrMetaKey: boolean) => {
      if (renaming || isPopoverActive) {
        return;
      }

      if (ctrlOrMetaKey) {
        toggleNav();
        const baseUrl = window.location.origin;
        const path = `/c/${conversationId}`;
        window.open(baseUrl + path, '_blank');
        return;
      }

      if (currentConvoId === conversationId) {
        return;
      }

      if (isMobile) {
        toggleNav();
      }

      navigateToConvo(
        conversation,
        {
          currentConvoId,
          resetLatestMessage: !(conversationId ?? '') || conversationId === Constants.NEW_CONVO,
        },
      );
    },
    [
      renaming,
      isPopoverActive,
      toggleNav,
      conversationId,
      currentConvoId,
      isMobile,
      navigateToConvo,
      conversation,
    ],
  );

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (renaming || e.touches.length !== 1) {
      return;
    }
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    didMove.current = false;
  }, [renaming]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (renaming || didMove.current || e.touches.length !== 1 || touchStartPos.current.x === null || touchStartPos.current.y === null) {
        return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartPos.current.x);
    const deltaY = Math.abs(currentY - touchStartPos.current.y);

    if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
      didMove.current = true;
    }
  }, [renaming]);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (renaming) {
        return;
      }

      const wasMove = didMove.current;
      touchStartPos.current = { x: null, y: null };
      didMove.current = false;

      if (wasMove) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      handleNavigation(false);
    },
    [renaming, handleNavigation],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (renaming) {
        return;
      }
      if (e.button !== 0) {
        return;
      }

      if (e.detail === 0) {
          return;
      }

      handleNavigation(e.ctrlKey || e.metaKey);
    },
    [renaming, handleNavigation],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (renaming) {
        return;
      }
      if (e.key === 'Enter') {
        handleNavigation(false);
      }
    },
    [renaming, handleNavigation],
  );

  const convoOptionsProps = {
    title,
    retainView,
    renameHandler: handleRename,
    isActiveConvo,
    conversationId,
    isPopoverActive,
    setIsPopoverActive,
  };

  return (
    <div
      className={cn(
        'group relative mt-1 flex h-8 w-full items-center rounded-lg bg-surface-secondary hover:bg-surface-tertiary dark:bg-darkbeige hover:dark:bg-darkbeige800',
        isActiveConvo ? 'bg-surface-tertiary dark:bg-darkbeige800' : '',
        'touch-manipulation',
      )}
      role="listitem"
      tabIndex={renaming ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        cursor: renaming ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent',
      }}
      data-testid="convo-item"
    >
      {renaming ? (
        <RenameForm
          titleInput={titleInput}
          setTitleInput={setTitleInput}
          onSubmit={handleRenameSubmit}
          onCancel={handleCancelRename}
          localize={localize}
        />
      ) : (
        <ConvoLink
          isActiveConvo={isActiveConvo}
          title={title}
          onRename={() => {}}
          isSmallScreen={isSmallScreen}
          localize={localize}
        />
      )}
      <div
        className={cn(
          'mr-2 flex origin-left',
          'transition-all duration-150 ease-in-out',
          isPopoverActive || isActiveConvo
            ? 'pointer-events-auto max-w-[28px] scale-x-100 opacity-100'
            : 'max-w-0 scale-x-0 opacity-0 group-hover:pointer-events-auto group-hover:max-w-[28px] group-hover:scale-x-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:max-w-[28px] group-focus-within:scale-x-100 group-focus-within:opacity-100',
        )}
        aria-hidden={!(isPopoverActive || isActiveConvo)}
      >
        <div onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          {!renaming && <ConvoOptions {...convoOptionsProps} />}
        </div>
      </div>
    </div>
  );
}
