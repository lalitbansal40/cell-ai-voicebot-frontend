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
  'call.created': {
    callId: string;
    direction: 'outbound' | 'inbound';
    to: string;
    campaignId?: string;
  };
  'call.status': { callId: string; status: CallStatus };
  'call.transcript': {
    callId: string;
    seq: number;
    speaker: 'customer' | 'bot' | 'agent';
    text: string;
    final: boolean;
  };
  'call.dtmf': { callId: string; digit: string };
  'call.ended': { callId: string; durationSec: number; disposition?: string; costMicros: number };
  'campaign.status': { campaignId: string; status: string };
  'campaign.progress': { campaignId: string; stats: Record<string, number> };
  'wallet.updated': { balanceMicros: number; holdMicros: number; currency: string };
  'wallet.low_balance': { availableMicros: number; thresholdMicros: number };
  'import.progress': { importJobId: string; processed: number; total: number; status: string };
  'notification.created': { notificationId: string; title: string };
  'presence.changed': { userId: string; status: 'online' | 'offline' };
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
  'wallet.updated',
  'wallet.low_balance',
  'import.progress',
  'notification.created',
  'presence.changed',
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
