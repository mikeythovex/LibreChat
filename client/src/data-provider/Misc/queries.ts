import { useRecoilValue } from 'recoil';
import { QueryKeys, dataService } from 'librechat-data-provider';
import { useQuery } from '@tanstack/react-query';
import type { QueryObserverResult, UseQueryOptions } from '@tanstack/react-query';
import type t from 'librechat-data-provider';
import store from '~/store';

// Define the user balance interface
interface TUserBalance {
  balance: string;
  totalCost: number;
  monthlyTotalCost: number;
}

export const useGetBannerQuery = (
  config?: UseQueryOptions<t.TBannerResponse>,
): QueryObserverResult<t.TBannerResponse> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<t.TBannerResponse>([QueryKeys.banner], () => dataService.getBanner(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};

export const useGetUserBalance = (
  config?: UseQueryOptions<TUserBalance>,
): QueryObserverResult<TUserBalance> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<TUserBalance>(
    [QueryKeys.balance],
    () =>
      // Handle both the new format (object with balance and totalCost) and old format (string)
      dataService.getUserBalance().then((response) => {
        if (typeof response === 'string') {
          return { balance: response, totalCost: 0, monthlyTotalCost: 0 };
        }
        return response as TUserBalance;
      }),
    {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      ...config,
      enabled: (config?.enabled ?? true) === true && queriesEnabled,
    },
  );
};

export const useGetSearchEnabledQuery = (
  config?: UseQueryOptions<boolean>,
): QueryObserverResult<boolean> => {
  const queriesEnabled = useRecoilValue<boolean>(store.queriesEnabled);
  return useQuery<boolean>([QueryKeys.searchEnabled], () => dataService.getSearchEnabled(), {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    ...config,
    enabled: (config?.enabled ?? true) === true && queriesEnabled,
  });
};
