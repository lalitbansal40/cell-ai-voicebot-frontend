/**
 * Dashboard WebSocket events (`/ws/events`).
 * Keep in sync with docs/conventions/websocket.md §5 and backend
 * src/core/realtime/events.ts — WS events are not part of the OpenAPI spec.
 */

/** Server → client envelope (websocket.md §3). */
export interface WsEventEnvelope<T = unknown> {
  id: string;
  type: string;
  ts: string;
  data: T;
}

export type CallStatus =
  'queued' | 'ringing' | 'in_progress' | 'completed' | 'failed' | 'busy' | 'no_answer' | 'canceled';

export interface WsEventMap {
  'call.created': { callId: string; isTest: boolean; campaignId?: string };
  'call.status': { callId: string; status: CallStatus };
  'call.transcript': {
    callId: string;
    seq: number;
    speaker: 'customer' | 'bot' | 'agent';
    text: string;
    final: boolean;
  };
  /** No digit — key presses can be PINs. */
  'call.dtmf': { callId: string };
  'call.ended': {
    callId: string;
    /** Campaign calls only (Phase 8). */
    campaignId?: string;
    status: CallStatus;
    endReason: string | null;
    durationSec: number;
    disposition: string | null;
    costMicros: number;
  };
  'campaign.status': {
    campaignId: string;
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'canceled' | 'failed';
    pauseReason?:
      | 'manual'
      | 'wallet_empty'
      | 'budget_reached'
      | 'account_suspended'
      | 'too_many_failures'
      | 'admin'
      | 'flow_not_runnable';
    /** ISO time the calling window opens again (running, outside the window). */
    waitingUntil?: string;
  };
  'campaign.progress': { campaignId: string; stats: Record<string, number> };
  /** Phase 9: a WhatsApp number changed (status, quality, limit, name). */
  'whatsapp.channel.updated': {
    channelId: string;
    status:
      | 'connecting'
      | 'connected'
      | 'action_needed'
      | 'needs_reconnect'
      | 'restricted'
      | 'disconnected';
    qualityRating: string;
    messagingLimitTier: string | null;
    nameStatus: string | null;
  };
  'wallet.updated': {
    balanceMicros: number;
    holdMicros: number;
    availableMicros: number;
    currency: string;
    status: 'ok' | 'low' | 'exhausted';
  };
  'wallet.low_balance': { availableMicros: number; thresholdMicros: number };
  'wallet.exhausted': { availableMicros: number };
  'import.progress': { importJobId: string; processed: number; total: number; status: string };
  'export.progress': { exportJobId: string; processed: number; total: number; status: string };
  'contacts.bulk_completed': { action: string; count: number };
  'contacts.changed': { reason: 'import' | 'bulk' | 'field_deleted' | 'list_deleted' | 'dnd' };
  'notification.created': { notificationId: string; title: string };
  'presence.changed': { userId: string; status: 'online' | 'offline' };
  'session.revoked': { reason: string };
  'account.updated': { fields: string[] };
  'account.suspended': { reason: string };
  'account.enabled': Record<string, never>;
  'user.updated': { userId: string };
  'team.changed': Record<string, never>;
  'kb.source.updated': {
    kbId: string;
    sourceId: string;
    status: 'queued' | 'processing' | 'ready' | 'failed' | 'stale';
    progress: number;
    error?: string;
  };
  'agent.updated': { agentId: string };
  'flow.updated': { flowId: string; revision: number; by: string | null };
  'flow.published': { flowId: string; version: number };
}

export type WsEventType = keyof WsEventMap;

export const WS_EVENT_TYPES: readonly WsEventType[] = [
  'call.created',
  'call.status',
  'call.transcript',
  'call.dtmf',
  'call.ended',
  'campaign.status',
  'campaign.progress',
  'whatsapp.channel.updated',
  'wallet.updated',
  'wallet.low_balance',
  'wallet.exhausted',
  'import.progress',
  'export.progress',
  'contacts.bulk_completed',
  'contacts.changed',
  'notification.created',
  'presence.changed',
  'session.revoked',
  'account.updated',
  'account.suspended',
  'account.enabled',
  'user.updated',
  'team.changed',
  'kb.source.updated',
  'agent.updated',
  'flow.updated',
  'flow.published',
];

export type WsEvent<K extends WsEventType = WsEventType> = WsEventEnvelope<WsEventMap[K]> & {
  type: K;
};

/** Client → server messages (websocket.md §4). Topics: `call:<id>`, `campaign:<id>`. */
export type WsClientMessage =
  | { type: 'ping' }
  | { type: 'subscribe'; topics: string[] }
  | { type: 'unsubscribe'; topics: string[] };

/** Close codes (websocket.md §7). */
export const WS_CLOSE = {
  normal: 1000,
  goingAway: 1001,
  abnormal: 1006,
  tooBig: 1009,
  unauthorized: 4001,
  forbidden: 4003,
  policy: 4008,
  tooManyConnections: 4009,
  ticketExpired: 4010,
} as const;
