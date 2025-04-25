import React, { useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys, Constants } from 'librechat-data-provider';
import type { TConversation, TMessage } from 'librechat-data-provider';
import { getEndpointField, getIconEndpoint, getIconKey } from '~/utils';
import ConvoIconURL from '~/components/Endpoints/ConvoIconURL';
import { useGetEndpointsQuery } from '~/data-provider';
import { useLocalize, useNewConvo } from '~/hooks';
import { icons } from '~/hooks/Endpoint/Icons';
import { NewChatIcon } from '~/components/svg';
import { cn } from '~/utils';
import store from '~/store';

const NewChatButtonIcon = React.memo(({ conversation }: { conversation: TConversation | null }) => {
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const search = useRecoilValue(store.search);
  const searchQuery = search.debouncedQuery;

  const computedIcon = useMemo(() => {
    if (searchQuery) {
      return null;
    }
    let { endpoint = '' } = conversation ?? {};
    const iconURL = conversation?.iconURL ?? '';
    endpoint = getIconEndpoint({ endpointsConfig, iconURL, endpoint });
    const endpointType = getEndpointField(endpointsConfig, endpoint, 'type');
    const endpointIconURL = getEndpointField(endpointsConfig, endpoint, 'iconURL');
    const iconKey = getIconKey({ endpoint, endpointsConfig, endpointType, endpointIconURL });
    const Icon = icons[iconKey];
    return { iconURL, endpoint, endpointType, endpointIconURL, Icon };
  }, [searchQuery, conversation, endpointsConfig]);

  if (searchQuery) {
    return (
      <div className="shadow-stroke relative flex h-7 w-7 items-center justify-center rounded-full bg-white text-black dark:bg-white">
        <Search className="h-5 w-5" />
      </div>
    );
  }

  if (!computedIcon) {
    return null;
  }

  const { iconURL, endpoint, endpointIconURL, Icon } = computedIcon;

  return (
    <div className="h-7 w-7 flex-shrink-0">
      {iconURL && iconURL.includes('http') ? (
        <ConvoIconURL
          iconURL={iconURL}
          modelLabel={conversation?.chatGptLabel ?? conversation?.modelLabel ?? ''}
          endpointIconURL={iconURL}
          context="nav"
        />
      ) : (
        <div className="shadow-stroke relative flex h-full items-center justify-center rounded-full bg-white text-black">
          {endpoint && Icon && (
            <Icon
              size={41}
              context="nav"
              className="h-2/3 w-2/3"
              endpoint={endpoint}
              iconURL={endpointIconURL}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
}: {
  index?: number;
  toggleNav: () => void;
  subHeaders?: React.ReactNode;
  isSmallScreen: boolean;
}) {
  return null;
}
