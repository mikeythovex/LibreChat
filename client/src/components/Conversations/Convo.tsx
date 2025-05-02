import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router-dom';
import { Constants } from 'librechat-data-provider';
import type { TConversation } from 'librechat-data-provider';
import { useNavigateToConvo, useMediaQuery, useLocalize } from '~/hooks';
import { useUpdateConversationMutation } from '~/data-provider';
import { NotificationSeverity } from '~/common';
import { ConvoOptions } from './ConvoOptions';
import { useToastContext } from '~/Providers';
import RenameForm from './RenameForm';
import { cn } from '~/utils';
import store from '~/store';

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
  // isLatestConvo, // Removed as unused
}: ConversationProps) {
  const params = useParams();
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const currentConvoId = useMemo(() => params.conversationId, [params.conversationId]);
  const updateConvoMutation = useUpdateConversationMutation(currentConvoId ?? '');
  const activeConvos = useRecoilValue(store.allConversationsSelector);
  // const { data: endpointsConfig } = useGetEndpointsQuery(); // Removed as unused
  const { navigateWithLastTools } = useNavigateToConvo();
  const isMobile = useMediaQuery('(max-width: 768px)'); // Consolidated useMediaQuery
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

  // Moved isActiveConvo definition before its usage
  const isActiveConvo = useMemo(() => {
    if (conversationId === Constants.NEW_CONVO) {
      return currentConvoId === Constants.NEW_CONVO;
    }

    if (currentConvoId !== Constants.NEW_CONVO) {
      return currentConvoId === conversationId;
    } else {
      // Assuming activeConvos is sorted with the latest first
      const latestConvoId = activeConvos?.[0]; // Access conversationId safely
      // Match against the specific ID, not the whole object comparison
      return latestConvoId === conversationId;
    }
  }, [currentConvoId, conversationId, activeConvos]);

  // Effect to update document title (moved from ConvoLink)
  useEffect(() => {
    if (isActiveConvo && title) {
      document.title = title + ' - BMO';
    }
    // Consider adding a cleanup function to reset the title if needed when component unmounts or isActiveConvo becomes false
  }, [isActiveConvo, title]);

  const handleRename = useCallback(() => { // Wrap handleRename in useCallback
    setIsPopoverActive(false);
    setTitleInput(title as string);
    setRenaming(true);
  }, [title]); // Add dependencies

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

  // Combined navigation logic, wrapped in useCallback
  const handleNavigation = useCallback(
    (ctrlOrMetaKey: boolean) => {
      // Already handled by interaction handlers checking `renaming`
      // if (renaming) {
      //   return;
      // }

      if (ctrlOrMetaKey && !isMobile) { // Only toggle nav on desktop with Ctrl/Meta
        // If you want Ctrl/Meta click on mobile to do something else, adjust logic here
        toggleNav();
        return;
      }

      // Prevent navigation if it's already the active conversation or popover is open
      // (Popover check might be redundant if clicking outside closes it, but safe to keep)
      if (currentConvoId === conversationId || isPopoverActive) {
        return;
      }

      // Close nav on mobile after selection
      if (isMobile) {
        toggleNav();
      }

      // Perform the actual navigation
      navigateWithLastTools(
        conversation,
        !(conversationId ?? '') || conversationId === Constants.NEW_CONVO,
      );
    },
    [
      currentConvoId,
      conversationId,
      isPopoverActive,
      isMobile,
      toggleNav,
      navigateWithLastTools,
      conversation, // Add conversation as dependency
      // renaming, // No longer needed here, checked in handlers
    ],
  );

  // Touch Handlers (wrapped in useCallback)
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (renaming || e.touches.length !== 1) {
      // Ignore if renaming or multi-touch
      return;
    }
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    didMove.current = false; // Reset movement flag
  }, [renaming]); // Dependency: renaming

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (renaming || didMove.current || e.touches.length !== 1 || touchStartPos.current.x === null || touchStartPos.current.y === null) {
        // Ignore if renaming, already moved, multi-touch, or start position wasn't recorded
        return;
    }

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = Math.abs(currentX - touchStartPos.current.x);
    const deltaY = Math.abs(currentY - touchStartPos.current.y);

    if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
      didMove.current = true; // Set flag indicating movement occurred
    }
  }, [renaming]); // Dependency: renaming

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (renaming) {
        return; // Ignore if renaming
      }

      const wasMove = didMove.current;
      // Reset refs for next touch interaction
      touchStartPos.current = { x: null, y: null };
      didMove.current = false;

      if (wasMove) {
        return; // Don't trigger action if it was considered a move/scroll
      }

      // --- It's a tap! ---
      // Prevent the browser from firing a simulated 'click' event shortly after.
      e.preventDefault();
      // Prevent click event from firing immediately after (on some browsers/setups)
      e.stopPropagation();

      // Execute the navigation action (pass false for ctrl/meta key)
      handleNavigation(false);
    },
    [renaming, handleNavigation], // Dependencies
  );

  // Click Handler (wrapped in useCallback)
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (renaming) {
        return; // Ignore if renaming
      }
      // Check for primary button (left click) - e.button should be 0
      if (e.button !== 0) {
        return;
      }

      // Don't run navigation if initiated by touchEnd's stopPropagation
      if (e.detail === 0) {
          // Mouse events typically have detail > 0, touch-simulated clicks might have 0
          return;
      }


      handleNavigation(e.ctrlKey || e.metaKey);
    },
    [renaming, handleNavigation], // Dependencies
  );

  // KeyDown Handler (wrapped in useCallback)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (renaming) {
        return; // Ignore if renaming
      }
      if (e.key === 'Enter') {
        handleNavigation(false); // Enter key doesn't have ctrl/meta context here
      }
    },
    [renaming, handleNavigation], // Dependencies
  );

  // Memoize ConvoOptions props if necessary, but less critical than handlers
  const convoOptionsProps = useMemo(() => ({
    title,
    retainView,
    renameHandler: handleRename,
    isActiveConvo,
    conversationId,
    isPopoverActive,
    setIsPopoverActive,
  //}), [title, retainView, handleRename, isActiveConvo, conversationId, isPopoverActive, setIsPopoverActive]);
  // handleRename is memoized with useCallback, no need to include it here unless its identity changes
  }), [title, retainView, isActiveConvo, conversationId, isPopoverActive, setIsPopoverActive, handleRename]);


  return (
    <div
      className={cn(
        'group relative mt-1 flex h-8 w-full items-center rounded-lg bg-surface-secondary hover:bg-surface-tertiary dark:bg-darkbeige hover:dark:bg-darkbeige800',
        isActiveConvo ? 'bg-surface-tertiary dark:bg-darkbeige800' : '',
        // Ensure touch actions are allowed, override potential parent settings if needed
        'touch-manipulation',
      )}
      role="listitem" // Changed to listitem as it's likely part of a list
      // Make it focusable only when not renaming
      tabIndex={renaming ? -1 : 0}
      // Attach all handlers
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // Apply styles conditionally
      style={{
        cursor: renaming ? 'default' : 'pointer',
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight on iOS
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
        // Inlined ConvoLink structure
        <>
          <div
            className={cn(
              'flex grow items-center gap-2 overflow-hidden whitespace-nowrap px-2 text-left',
              // Removed unnecessary button styles like border-none, bg-transparent, outline-none as parent handles interaction
              // Ensure touch-manipulation is on the parent if needed, seems it is already
            )}
            title={title ?? undefined}
            aria-current={isActiveConvo ? 'page' : undefined}
            style={{ WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', overflow: 'hidden', display: '-webkit-box' }} // Ellipsis styles
          >
            {title || localize('com_ui_untitled')}
          </div>
          {/* Fade out gradient */}
          <div
            className={cn(
              'absolute bottom-0 right-0 top-0 w-5 bg-gradient-to-l', // Ensure gradient covers options button area if needed
              isActiveConvo
                ? 'from-surface-active-alt'
                : 'from-beigesecondary from-0% to-transparent group-hover:from-beigesecondary group-hover:from-40% dark:from-darkbeige dark:group-hover:from-darkbeige',
              // Ensure this gradient aligns correctly with the options menu appearing/disappearing
              'rounded-r-lg' // Match parent rounding
            )}
            aria-hidden="true"
          />
        </>
        // End Inlined ConvoLink structure
      )}
      <div
        className={cn(
          'absolute right-0 mr-1 flex origin-right items-center pr-1', // Added absolute, right-0, items-center, pr-1
          // Simplified condition for visibility based on focus/hover/active states
          'transition-all duration-150 ease-in-out', // Added transition
          isPopoverActive || isActiveConvo
            ? 'pointer-events-auto max-w-[28px] scale-x-100 opacity-100'
            // Ensure hover/focus still reveal options correctly
            : 'max-w-0 scale-x-0 opacity-0 group-hover:pointer-events-auto group-hover:max-w-[28px] group-hover:scale-x-100 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:max-w-[28px] group-focus-within:scale-x-100 group-focus-within:opacity-100',
          renaming ? 'hidden' : '', // Hide options when renaming
        )}
        aria-hidden={renaming || !(isPopoverActive || isActiveConvo)} // Also hide if renaming
      >
        {/* Prevent options button from triggering navigation if clicked */}
        {/* Wrap options in a div that stops propagation */}
        <div onClick={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
          <ConvoOptions {...convoOptionsProps} />
        </div>
      </div>
    </div>
  );
}
