import { apiClient, unwrap } from './client';
import type { Schemas, SuccessEnvelope } from './types';

/** PIN: the Pinnacle partner API reference (superadmins only). */
export type PartnerApiInfo = Schemas['PartnerApiInfo'];
export type PartnerEndpoint = PartnerApiInfo['endpoints'][number];
export type PartnerNumber = PartnerApiInfo['numbers'][number];
export interface PartnerReveal {
  apiKey: string;
  keyLast4: string;
  expiresInSec: number;
}
export interface PartnerTryResult {
  endpointId: string;
  ok: boolean;
  httpStatus: number;
  durationMs: number;
  body: unknown;
}

/** `admin` = Admin pages (the account by id); `full` = a superadmin's full-access session. */
export type PartnerScope = { kind: 'admin'; accountId: string } | { kind: 'full' };

const channelBase = (scope: PartnerScope, channelId: string) =>
  scope.kind === 'admin'
    ? `/admin/whatsapp/channels/${channelId}/partner-api`
    : `/whatsapp/channels/${channelId}/partner-api`;

export const partnerApi = {
  info: (scope: PartnerScope) =>
    unwrap(
      apiClient.get<SuccessEnvelope<PartnerApiInfo>>(
        scope.kind === 'admin'
          ? `/admin/accounts/${scope.accountId}/partner-api`
          : '/whatsapp/partner-api',
      ),
    ),
  reveal: (scope: PartnerScope, channelId: string, body: { password: string; code?: string }) =>
    unwrap(
      apiClient.post<SuccessEnvelope<PartnerReveal>>(
        `${channelBase(scope, channelId)}/reveal`,
        body,
      ),
    ),
  tryIt: (scope: PartnerScope, channelId: string, endpointId: string) =>
    unwrap(
      apiClient.post<SuccessEnvelope<PartnerTryResult>>(`${channelBase(scope, channelId)}/try`, {
        endpointId,
      }),
    ),
};
