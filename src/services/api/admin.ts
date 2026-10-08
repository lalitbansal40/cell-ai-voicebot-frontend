import { apiClient, unwrap } from './client';
import type {
  AdminAccountDetail,
  AdminAccountRow,
  AuthSession,
  ListEnvelope,
  OffsetPageMeta,
  PublicAccount,
  SuccessEnvelope,
} from './types';

export interface AdminAccountsQuery {
  page?: number;
  limit?: number;
  status?: 'active' | 'suspended';
  search?: string;
}

/** Superadmin endpoints (`/api/v1/admin/*`). */
export const adminApi = {
  accounts: async (query: AdminAccountsQuery) =>
    (
      await apiClient.get<ListEnvelope<AdminAccountRow, OffsetPageMeta>>('/admin/accounts', {
        params: query,
      })
    ).data,
  account: (id: string) =>
    unwrap(apiClient.get<SuccessEnvelope<AdminAccountDetail>>(`/admin/accounts/${id}`)),
  suspend: (id: string, reason: string) =>
    unwrap(
      apiClient.post<SuccessEnvelope<PublicAccount>>(`/admin/accounts/${id}/suspend`, { reason }),
    ),
  enable: (id: string) =>
    unwrap(apiClient.post<SuccessEnvelope<PublicAccount>>(`/admin/accounts/${id}/enable`)),
  impersonate: (id: string) =>
    unwrap(apiClient.post<SuccessEnvelope<AuthSession>>(`/admin/accounts/${id}/impersonate`)),
  stopImpersonation: () => apiClient.post('/admin/impersonation/stop').then(() => undefined),
};
