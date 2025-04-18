import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  AgentsMapContext,
  AssistantsMapContext,
  FileMapContext,
  SearchContext,
  SetConvoProvider,
} from '~/Providers';
import { useAuthContext, useAssistantsMap, useAgentsMap, useFileMap, useSearch } from '~/hooks';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { Nav, MobileNav } from '~/components/Nav';
import { Banner } from '~/components/Banners';

export default function Root() {
  const [bannerHeight, setBannerHeight] = useState(0);
  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });

  const { isAuthenticated, logout } = useAuthContext();
  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });
  const search = useSearch({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SetConvoProvider>
      <SearchContext.Provider value={search}>
        <FileMapContext.Provider value={fileMap}>
          <AssistantsMapContext.Provider value={assistantsMap}>
            <AgentsMapContext.Provider value={agentsMap}>
              <Banner onHeightChange={setBannerHeight} />
              <div className="flex" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
                <div className="relative z-0 flex h-full w-full overflow-hidden">
                  <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
                  <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
                    <MobileNav setNavVisible={setNavVisible} />
                    <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                  </div>
                </div>
              </div>
            </AgentsMapContext.Provider>
          </AssistantsMapContext.Provider>
        </FileMapContext.Provider>
      </SearchContext.Provider>
    </SetConvoProvider>
  );
}
