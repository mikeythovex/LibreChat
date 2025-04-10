import type { TConfig, TEndpointsConfig, TInterfaceConfig } from 'librechat-data-provider';
import {
  EModelEndpoint,
  isAssistantsEndpoint,
  Permissions,
  PermissionTypes
} from 'librechat-data-provider';
import { useMemo } from 'react';
import type { NavLink } from '~/common';
import AgentPanelSwitch from '~/components/SidePanel/Agents/AgentPanelSwitch';
import PanelSwitch from '~/components/SidePanel/Builder/PanelSwitch';
import { Blocks, ChatGPTMinimalIcon } from '~/components/svg';
import { useHasAccess } from '~/hooks';


export default function useSideNavLinks({
  hidePanel,
  assistants,
  agents,
  keyProvided,
  endpoint,
  endpointType,
  interfaceConfig,
  endpointsConfig,
}: {
  hidePanel: () => void;
  assistants?: TConfig | null;
  agents?: TConfig | null;
  keyProvided: boolean;
  endpoint?: EModelEndpoint | null;
  endpointType?: EModelEndpoint | null;
  interfaceConfig: Partial<TInterfaceConfig>;
  endpointsConfig: TEndpointsConfig;
}) {
  const Links = useMemo(() => {
    const links: NavLink[] = [];
    // if (
    //   isAssistantsEndpoint(endpoint) &&
    //   assistants &&
    //   assistants.disableBuilder !== true &&
    //   keyProvided
    // ) {
    //   links.push({
    //     title: 'com_sidepanel_assistant_builder',
    //     label: '',
    //     icon: Blocks,
    //     id: 'assistants',
    //     Component: PanelSwitch,
    //   });
    // }

    if (
      endpointsConfig?.[EModelEndpoint.agents] &&
      agents &&
      agents.disableBuilder !== true
    ) {
      links.push({
        title: 'com_sidepanel_agent_builder',
        label: '',
        icon: ChatGPTMinimalIcon,
        id: 'agents',
        Component: AgentPanelSwitch,
      });
    }

    // if (hasAccessToPrompts) {
    //   links.push({
    //     title: 'com_ui_prompts',
    //     label: '',
    //     icon: MessageSquareQuote,
    //     id: 'prompts',
    //     Component: PromptsAccordion,
    //   });
    // }

    // if (
    //   interfaceConfig.parameters === true &&
    //   isParamEndpoint(endpoint ?? '', endpointType ?? '') === true &&
    //   !isAgentsEndpoint(endpoint) &&
    //   keyProvided
    // ) {
    //   links.push({
    //     title: 'com_sidepanel_parameters',
    //     label: '',
    //     icon: Settings2,
    //     id: 'parameters',
    //     Component: Parameters,
    //   });
    // }

    // links.push({
    //   title: 'com_sidepanel_attach_files',
    //   label: '',
    //   icon: AttachmentIcon,
    //   id: 'files',
    //   Component: FilesPanel,
    // });

    // if (hasAccessToBookmarks) {
    //   links.push({
    //     title: 'com_sidepanel_conversation_tags',
    //     label: '',
    //     icon: Bookmark,
    //     id: 'bookmarks',
    //     Component: BookmarkPanel,
    //   });
    // }

    // links.push({
    //   title: 'com_sidepanel_hide_panel',
    //   label: '',
    //   icon: ArrowRightToLine,
    //   onClick: hidePanel,
    //   id: 'hide-panel',
    // });

    return links;
  }, [
    endpointsConfig?.[EModelEndpoint.agents],
    interfaceConfig.parameters,
    keyProvided,
    assistants,
    endpointType,
    endpoint,
    agents,
    null,
    null,
    null,
    null,
    hidePanel,
  ]);

  return Links;
}
