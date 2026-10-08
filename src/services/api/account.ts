import { apiClient, unwrap } from './client';
import type { AuthMe, PublicAccount, SuccessEnvelope } from './types';

export interface AccountUpdate {
  name?: string;
  timezone?: string;
  country?: string;
  defaultLanguage?: 'hi' | 'en' | 'hinglish';
  settings?: {
    callingWindow?: { start: string; end: string; days: number[] };
    recordingEnabled?: boolean;
    aiDisclosureEnabled?: boolean;
  };
}

/** `/api/v1/account` + own profile. */
export const accountApi = {
  get: () => unwrap(apiClient.get<SuccessEnvelope<PublicAccount>>('/account')),
  update: (body: AccountUpdate) =>
    unwrap(apiClient.patch<SuccessEnvelope<PublicAccount>>('/account', body)),
  updateProfile: (body: { name?: string; phone?: string | null }) =>
    unwrap(apiClient.patch<SuccessEnvelope<AuthMe>>('/auth/me', body)),
};
