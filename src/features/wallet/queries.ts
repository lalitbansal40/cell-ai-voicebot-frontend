import { useQuery } from '@tanstack/react-query';

import { usePermission } from '@/features/auth/hooks';
import { useAuthStore } from '@/features/auth/store';
import { billingApi } from '@/services/api/billing';
import { walletApi } from '@/services/api/wallet';

import { billingKeys, walletKeys } from './keys';

/** The account wallet (only fetched with `wallet.read`; WS keeps it fresh). */
export const useWallet = () => {
  const canRead = usePermission('wallet.read');
  return useQuery({ queryKey: walletKeys.wallet, queryFn: walletApi.get, enabled: canRead });
};

export const useRates = () => useQuery({ queryKey: walletKeys.rates, queryFn: walletApi.rates });

export const useBillingProfile = (enabled = true) =>
  useQuery({ queryKey: billingKeys.profile, queryFn: billingApi.profile, enabled });

export const useGstStates = () =>
  useQuery({ queryKey: billingKeys.states, queryFn: billingApi.states, staleTime: Infinity });

/** Can this user add money right now (permission, and never while impersonating)? */
export const useCanTopUp = (): boolean => {
  const canTopUp = usePermission('wallet.topup');
  const impersonating = useImpersonating();
  return canTopUp && !impersonating;
};

export const useImpersonating = (): boolean =>
  useAuthStore((s) => Boolean(s.session?.impersonation));
