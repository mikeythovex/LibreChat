import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConfigDefaults, PermissionTypes, Permissions } from 'librechat-data-provider';
import type { ContextType } from '~/common';
import ModelSelector from './Menus/Endpoints/ModelSelector';
import { useGetStartupConfig } from '~/data-provider';
import ExportAndShareMenu from './ExportAndShareMenu';
import { useMediaQuery, useHasAccess } from '~/hooks';
import BookmarkMenu from './Menus/BookmarkMenu';
import { TemporaryChat } from './TemporaryChat';
import AddMultiConvo from './AddMultiConvo';
import CreateNewChat from './CreateNewChat';

export default function Header() {
  const { data: startupConfig } = useGetStartupConfig();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  return (
    <div className="sticky top-0 z-10 flex h-14 w-full items-center justify-between bg-beige p-2 font-semibold text-text-primary dark:bg-gray-800">
      <div className="hide-scrollbar flex w-full items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          {<ModelSelector startupConfig={startupConfig} />}
          <AddMultiConvo />
          {!isSmallScreen && <CreateNewChat /> }
          {isSmallScreen && <TemporaryChat />}
        </div>
        {!isSmallScreen && (
          <div className="flex items-center gap-2">
            <TemporaryChat />
          </div>
        )}
      </div>
      {/* Empty div for spacing */}
      <div />
    </div>
  );
}
