import { apiClient, unwrap } from './client';
import type { components } from './schema.gen';
import type { SuccessEnvelope } from './types';

type Schemas = components['schemas'];
export type AccountVoiceApi = Schemas['AccountVoiceApi'];
export type AdminVoiceStatus = Schemas['AdminVoiceStatus'];
export type AdminVoiceIvr = Schemas['AdminVoiceIvr'];
/** Which Cell24x7 login an account uses (never the token). */
export type VoiceCredentials = Schemas['VoiceCredentials'];
export type VoiceCredentialsInput = Schemas['VoiceCredentialsBody'];
/** IVR: Test connection / test call / last provider answer of an account. */
export type VoiceDiagnostics = Schemas['VoiceApiDiagnostics'];
export type VoiceLastCheck = NonNullable<VoiceDiagnostics['lastCheck']>;
export type VoiceTestCall = NonNullable<VoiceDiagnostics['lastTestCall']>;
export type VoiceTestCallInput = Schemas['VoiceTestCallInput'];
export interface VoiceTestCallResult {
  test: VoiceTestCall;
  result: {
    status: string;
    durationSec: number;
    retryCount: number;
    keyPressed: string | null;
    ivrDisposition: string | null;
  } | null;
}

export const voiceApiKeys = {
  status: ['admin', 'voice-api', 'status'] as const,
  ivrs: ['admin', 'voice-api', 'ivrs'] as const,
  diagnostics: (accountId: string) => ['admin', 'voice-api', 'diagnostics', accountId] as const,
};

/** Recorded-voice / IVR campaigns over Cell24x7 — superadmin controls (VAPI). */
export const voiceAdminApi = {
  setAccount: (accountId: string, body: Partial<AccountVoiceApi>) =>
    unwrap(
      apiClient.patch<SuccessEnvelope<AccountVoiceApi>>(
        `/admin/accounts/${accountId}/voice-api`,
        body,
      ),
    ),
  /** The account's own Cell24x7 token + caller ID (checked first), or back to the platform token. */
  setCredentials: (accountId: string, body: VoiceCredentialsInput) =>
    unwrap(
      apiClient.put<SuccessEnvelope<VoiceCredentials>>(
        `/admin/accounts/${accountId}/voice-api/credentials`,
        body,
      ),
    ),
  /** Points the account's own Cell24x7 login at its own result webhook. */
  registerAccountWebhook: (accountId: string) =>
    unwrap(
      apiClient.post<SuccessEnvelope<VoiceCredentials>>(
        `/admin/accounts/${accountId}/voice-api/webhook`,
      ),
    ),
  /** IVR-T1: `GET /ivrs` with the account's login from our server (saved as the last check). */
  testConnection: (accountId: string) =>
    unwrap(
      apiClient.post<SuccessEnvelope<VoiceLastCheck>>(
        `/admin/accounts/${accountId}/voice-api/test-connection`,
      ),
    ),
  /** IVR-T2: one real call (owner's OK), 3 / hour, not billed to the wallet. */
  sendTestCall: (accountId: string, body: VoiceTestCallInput) =>
    unwrap(
      apiClient.post<SuccessEnvelope<VoiceTestCall>>(
        `/admin/accounts/${accountId}/voice-api/test-call`,
        body,
      ),
    ),
  testCallResult: (accountId: string) =>
    unwrap(
      apiClient.get<SuccessEnvelope<VoiceTestCallResult>>(
        `/admin/accounts/${accountId}/voice-api/test-call`,
      ),
    ),
  diagnostics: (accountId: string) =>
    unwrap(
      apiClient.get<SuccessEnvelope<VoiceDiagnostics>>(
        `/admin/accounts/${accountId}/voice-api/diagnostics`,
      ),
    ),
  status: () => unwrap(apiClient.get<SuccessEnvelope<AdminVoiceStatus>>('/admin/voice-api/status')),
  registerWebhook: () =>
    unwrap(
      apiClient.post<SuccessEnvelope<{ registered: boolean; matches: boolean }>>(
        '/admin/voice-api/webhook',
      ),
    ),
  ivrs: () => unwrap(apiClient.get<SuccessEnvelope<AdminVoiceIvr[]>>('/admin/voice-api/ivrs')),
  resolveBatch: (
    campaignId: string,
    batchNo: number,
    body: { outcome: 'submitted'; requestId: string } | { outcome: 'not_submitted' },
  ) =>
    unwrap(
      apiClient.post<SuccessEnvelope<{ batchNo: number; state: string }>>(
        `/admin/campaigns/${campaignId}/voice-batches/${String(batchNo)}/resolve`,
        body,
      ),
    ),
};
