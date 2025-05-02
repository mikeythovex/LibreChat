import React, { useMemo, useEffect, useRef } from 'react';
import { isAgentsEndpoint, isAssistantsEndpoint, LocalStorageKeys } from 'librechat-data-provider';
import type * as t from 'librechat-data-provider';
import type { SelectedValues } from '~/common';
import useSetIndexOptions from '~/hooks/Conversations/useSetIndexOptions';

export default function useSelectorEffects({
  index = 0,
  agentsMap,
  conversation,
  assistantsMap,
  setSelectedValues,
}: {
  index?: number;
  agentsMap: t.TAgentsMap | undefined;
  assistantsMap: t.TAssistantsMap | undefined;
  conversation: t.TConversation | null;
  setSelectedValues: React.Dispatch<React.SetStateAction<SelectedValues>>;
}) {
  const { setOption } = useSetIndexOptions();
  const agents: t.Agent[] = useMemo(() => {
    return Object.values(agentsMap ?? {}) as t.Agent[];
  }, [agentsMap]);
  const {
    agent_id: selectedAgentId = null,
    assistant_id: selectedAssistantId = null,
    endpoint,
  } = conversation ?? {};
  const assistants: t.Assistant[] = useMemo(() => {
    if (!isAssistantsEndpoint(endpoint)) {
      return [];
    }
    return Object.values(assistantsMap?.[endpoint ?? ''] ?? {}) as t.Assistant[];
  }, [assistantsMap, endpoint]);

  // Commented out auto-selection of agents
  // useEffect(() => {
  //   if (!isAgentsEndpoint(endpoint as string)) {
  //     return;
  //   }
  //   if (selectedAgentId == null && agents.length > 0) {
  //     let agent_id = localStorage.getItem(`${LocalStorageKeys.AGENT_ID_PREFIX}${index}`);
  //     if (agent_id == null) {
  //       agent_id = agents[0]?.id;
  //     }
  //     const agent = agentsMap?.[agent_id];

  //     if (agent !== undefined) {
  //       setOption('model')('');
  //       setOption('agent_id')(agent_id);
  //     }
  //   }
  // }, [index, agents, selectedAgentId, agentsMap, endpoint, setOption]);

  // Commented out auto-selection of assistants
  // useEffect(() => {
  //   if (!isAssistantsEndpoint(endpoint as string)) {
  //     return;
  //   }
  //   if (selectedAssistantId == null && assistants.length > 0) {
  //     let assistant_id = localStorage.getItem(`${LocalStorageKeys.ASST_ID_PREFIX}${index}`);
  //     if (assistant_id == null) {
  //       assistant_id = assistants[0]?.id;
  //     }
  //     const assistant = assistantsMap?.[endpoint ?? '']?.[assistant_id];
  //     if (assistant !== undefined) {
  //       setOption('model')(assistant.model);
  //       setOption('assistant_id')(assistant_id);
  //     }
  //   }
  // }, [index, assistants, selectedAssistantId, assistantsMap, endpoint, setOption]);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedSetSelectedValues = (values: SelectedValues) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setSelectedValues(values);
    }, 150);
  };

  useEffect(() => {
    // Only set selected values if this is an existing conversation with values already set
    if (!conversation?.endpoint) {
      return;
    }
    
    // Check if this is a new conversation (usually at /c/new path)
    const isNewConversation = 
      !conversation.conversationId || 
      conversation.conversationId === 'new';
    
    // Don't set default values for new conversations
    if (isNewConversation && conversation?.endpoint !== 'OpenRouter') {
      return;
    }
    
    if (
      conversation?.assistant_id ||
      conversation?.agent_id ||
      conversation?.model ||
      conversation?.spec
    ) {
      if (isAgentsEndpoint(conversation?.endpoint)) {
        debouncedSetSelectedValues({
          endpoint: conversation.endpoint || '',
          model: conversation.agent_id ?? '',
          modelSpec: conversation.spec || '',
        });
        return;
      } else if (isAssistantsEndpoint(conversation?.endpoint)) {
        debouncedSetSelectedValues({
          endpoint: conversation.endpoint || '',
          model: conversation.assistant_id || '',
          modelSpec: conversation.spec || '',
        });
        return;
      }
      debouncedSetSelectedValues({
        endpoint: conversation.endpoint || '',
        model: conversation.model || '',
        modelSpec: conversation.spec || '',
      });
    }
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [
    conversation?.spec,
    conversation?.model,
    conversation?.endpoint,
    conversation?.agent_id,
    conversation?.assistant_id,
  ]);
}
