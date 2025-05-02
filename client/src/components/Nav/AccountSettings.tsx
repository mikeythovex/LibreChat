import { useState, memo } from 'react';
import { useRecoilState } from 'recoil';
import * as Select from '@ariakit/react/select';
import { FileText, LogOut, Activity, User } from 'lucide-react';
import { LinkIcon, GearIcon, DropdownMenuSeparator } from '~/components';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import FilesView from '~/components/Chat/Input/Files/FilesView';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import { UserIcon } from '~/components/svg';
import { useLocalize } from '~/hooks';
import Settings from './Settings';
import store from '~/store';

function AccountSettings() {
  const localize = useLocalize();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showFiles, setShowFiles] = useRecoilState(store.showFiles);

  const avatarSrc = useAvatar(user);
  const avatarSeed = user?.avatar || user?.name || user?.username || '';

  const hasBalance =
    balanceQuery.data?.balance != null && !isNaN(parseFloat(balanceQuery.data.balance));

  const hasAllTimeCost =
    balanceQuery.data?.totalCost != null && !isNaN(parseFloat(String(balanceQuery.data.totalCost)));

  const hasMonthlyTotalCost =
    balanceQuery.data?.monthlyTotalCost != null &&
    !isNaN(parseFloat(String(balanceQuery.data.monthlyTotalCost)));

  const formatCost = (cost: number | undefined) => {
    if (cost === undefined) return '$0.0000';
    return `$${parseFloat(String(cost)).toFixed(4)}`;
  };

  return (
    <Select.SelectProvider>
      <Select.Select
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        className="mt-text-sm duration-50 ml-2 my-0 flex h-auto items-center gap-2 rounded-xl p-2 text-sm transition-all ease-in-out hover:bg-surface-tertiary hover:dark:bg-darkbeige800"
      >
        <div className="h-8 w-6 flex-shrink-0">
          <div className="relative flex">
            <div
              style={{
                width: '32px',
                height: '32px',
              }}
              className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
              aria-hidden="true"
            >
              <User className="icon-heavy h-5 w-5" />
            </div>
          </div>
        </div>
        <div
          className="mt-2 grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
          style={{ marginTop: '0', marginLeft: '0.25rem', fontWeight: 500}}
        >
            {user?.name?.split(' ')[0] ?? user?.username ?? localize('com_nav_user')}
        </div>
      </Select.Select>
      <Select.SelectPopover
        className="popover-ui w-[235px] bg-surface-primary"
        style={{
          transformOrigin: 'bottom',
          marginRight: '0px',
          translate: '0px',
          zIndex: 9999,
        }}
      >
        {/* // TODO: Add balance for session */}
        {startupConfig?.balance?.enabled === true && (hasAllTimeCost || hasMonthlyTotalCost) && (
          <>
            {hasMonthlyTotalCost && (
              <div
                className="text-token-text-secondary ml-2 mr-2 cursor-default py-1 text-sm"
                role="note"
              >
                <Activity className="icon-md mr-2 inline-block" />
                Usage this month: {formatCost(balanceQuery.data?.monthlyTotalCost)}
              </div>
            )}

            {/* {hasAllTimeCost && (
              <div className="text-token-text-secondary ml-3 mr-2 py-1 text-sm" role="note">
                All time: {formatCost(balanceQuery.data?.totalCost)}
              </div>
            )} */}
            <DropdownMenuSeparator />
          </>
        )}
        <Select.SelectItem
          value=""
          onClick={() => setShowSettings(true)}
          className="select-item text-sm"
        >
          <GearIcon className="icon-md" aria-hidden="true" />
          {localize('com_nav_settings')}
        </Select.SelectItem>
        <Select.SelectItem
          aria-selected={true}
          onClick={() => logout()}
          value="logout"
          className="select-item text-sm"
        >
          <LogOut className="icon-md" />
          {localize('com_nav_log_out')}
        </Select.SelectItem>
      </Select.SelectPopover>
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </Select.SelectProvider>
  );
}

export default memo(AccountSettings);
