import React from 'react';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: any, options?: any) => string;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  title,
  onRename,
  isSmallScreen,
  localize,
}) => {
  return (
    <div
      className={cn(
        'flex grow items-center gap-2 overflow-hidden rounded-lg px-2',
        isActiveConvo ? 'bg-beigetertiary dark:bg-darkbeige800 hover:dark:bg-darkbeige800' : '',
      )}
      title={title ?? undefined}
      aria-current={isActiveConvo ? 'page' : undefined}
      style={{ width: '100%' }}
    >
      <div
        className="relative flex-1 grow overflow-hidden whitespace-nowrap"
        style={{ textOverflow: 'ellipsis' }}
        onDoubleClick={(e) => {
          if (isSmallScreen) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          onRename();
        }}
        role="button"
        aria-label={isSmallScreen ? undefined : localize('com_ui_double_click_to_rename')}
      >
        {title || localize('com_ui_untitled')}
      </div>
      <div
        className={cn(
          'absolute bottom-0 right-0 top-0 w-5 rounded-r-lg bg-gradient-to-l',
          isActiveConvo
            ? 'from-surface-active-alt'
            : 'from-beigesecondary dark:from-darkbeige from-0% to-transparent group-hover:from-beigesecondary dark:group-hover:from-darkbeige group-hover:from-40%',
        )}
        aria-hidden="true"
      />
    </div>
  );
};

export default ConvoLink;
