import { apiClient, unwrap } from './client';
import type {
  MetaWebhookReceipt,
  SuccessEnvelope,
  WhatsAppChannel,
  WhatsAppChannelDetail,
  WhatsAppChannelList,
  WhatsAppChannelStatus,
  WhatsAppConfig,
  WhatsAppConnectResult,
  WhatsAppMode,
} from './types';

export interface EmbeddedSignupInput {
  code: string;
  mode: WhatsAppMode;
  /** Ids from Meta's WA_EMBEDDED_SIGNUP message — hints the server verifies. */
  sessionInfo?: { wabaId?: string; phoneNumberId?: string };
}

export type ChannelOutcome = WhatsAppConnectResult['outcome'];
export interface ChannelActionResult {
  channel: WhatsAppChannel;
  outcome: ChannelOutcome;
}

/** Dev webhook simulator kinds (backend `SIMULATOR_KINDS`). */
export const SIMULATOR_KINDS = [
  'quality_downgrade',
  'quality_upgrade',
  'flagged',
  'name_approved',
  'name_rejected',
  'restricted',
  'unrestricted',
  'token_revoked',
  'inbound_text',
  'status_delivered',
  'echo_text',
  'history_chunk',
  'history_declined',
  'contacts_sync',
  'payment_method_added',
  'phone_number_added',
] as const;
export type SimulatorKind = (typeof SIMULATOR_KINDS)[number];

const channel = (id: string, action = '') => `/whatsapp/channels/${id}${action}`;

/** `/api/v1/whatsapp` (PHASE_9_PLAN §1n). */
export const whatsappApi = {
  config: () => unwrap(apiClient.get<SuccessEnvelope<WhatsAppConfig>>('/whatsapp/config')),
  channels: (status?: WhatsAppChannelStatus) =>
    unwrap(
      apiClient.get<SuccessEnvelope<WhatsAppChannelList>>('/whatsapp/channels', {
        params: status ? { status } : {},
      }),
    ),
  channel: (id: string) =>
    unwrap(apiClient.get<SuccessEnvelope<WhatsAppChannelDetail>>(channel(id))),
  signup: (body: EmbeddedSignupInput) =>
    unwrap(
      apiClient.post<SuccessEnvelope<WhatsAppConnectResult>>(
        '/whatsapp/channels/embedded-signup',
        body,
      ),
    ),
  rename: (id: string, label: string) =>
    unwrap(apiClient.patch<SuccessEnvelope<WhatsAppChannel>>(channel(id), { label })),
  sync: (id: string) =>
    unwrap(apiClient.post<SuccessEnvelope<ChannelActionResult>>(channel(id, '/sync'))),
  retrySetup: (id: string) =>
    unwrap(apiClient.post<SuccessEnvelope<ChannelActionResult>>(channel(id, '/retry-setup'))),
  register: (id: string, pin: string) =>
    unwrap(apiClient.post<SuccessEnvelope<ChannelActionResult>>(channel(id, '/register'), { pin })),
  coexistenceSync: (id: string) =>
    unwrap(
      apiClient.post<SuccessEnvelope<{ channel: WhatsAppChannel }>>(
        channel(id, '/coexistence-sync'),
      ),
    ),
  disconnect: (id: string) =>
    unwrap(apiClient.post<SuccessEnvelope<WhatsAppChannel>>(channel(id, '/disconnect'))),
  /** DEV ONLY — `POST /dev/meta/webhooks` (absent in production). */
  simulate: (channelId: string, kind: SimulatorKind) =>
    unwrap(
      apiClient.post<SuccessEnvelope<MetaWebhookReceipt & { kind: string; field: string }>>(
        '/dev/meta/webhooks',
        { channelId, kind },
      ),
    ),
};
