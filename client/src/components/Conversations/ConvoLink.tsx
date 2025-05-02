import React, { useEffect } from 'react';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: any, options?: any) => string;
  onClick?: (e: React.MouseEvent) => void;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  title,
  onRename,
  isSmallScreen,
  localize,
  onClick,
}) => {
  useEffect(() => {
    if (isActiveConvo && title) {
      document.title = title + ' - BMO';
    }
  }, [isActiveConvo, title]);

  const handleTouch = (e: React.TouchEvent) => {
    // Prevent default behavior to avoid double events
    e.preventDefault();
    e.stopPropagation();

    if (onClick) {
      onClick({
        button: 0,
        ctrlKey: false,
        metaKey: false,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as React.MouseEvent);
    }
  };

  return (
    <button
      type="button"
      className={cn(
        'flex w-full grow touch-manipulation items-center gap-2 overflow-hidden rounded-lg border-none bg-transparent px-2 text-left outline-none',
        isActiveConvo ? 'bg-surface-tertiary dark:bg-darkbeige800 hover:dark:bg-darkbeige800' : '',
      )}
      title={title ?? undefined}
      aria-current={isActiveConvo ? 'page' : undefined}
      style={{ width: '100%' }}
      onClick={onClick}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={handleTouch}
    >
      <div
        className="relative flex-1 grow overflow-hidden whitespace-nowrap"
        style={{ textOverflow: 'ellipsis' }}
        role="presentation"
        aria-label={isSmallScreen ? undefined : localize('com_ui_double_click_to_rename')}
      >
        {title || localize('com_ui_untitled')}
      </div>
      <div
        className={cn(
          'absolute bottom-0 right-0 top-0 w-5 rounded-r-lg',
          isActiveConvo
            ? 'from-surface-active-alt'
            : 'from-beigesecondary from-0% to-transparent group-hover:from-beigesecondary group-hover:from-40% dark:from-darkbeige dark:group-hover:from-darkbeige',
        )}
        aria-hidden="true"
      />
    </button>
  );
};

export default ConvoLink;
