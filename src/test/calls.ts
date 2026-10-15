import type { Call, CallEvent, CallTranscriptTurn } from '@/services/api/types';

/** A finished flow test call (override what the test needs). */
export const fakeCall = (overrides: Partial<Call> = {}): Call => ({
  id: 'c1',
  direction: 'outbound',
  provider: 'webcall',
  isTest: true,
  status: 'completed',
  endReason: 'hangup_node',
  source: { kind: 'flow', flowId: 'f1', flowVersionRef: 1, agentId: null, name: 'Loan recovery' },
  contact: { id: 'k1', name: 'Asha Verma' },
  startedBy: { id: 'u1', name: 'Demo Owner' },
  timestamps: {
    queuedAt: '2026-10-15T10:00:00.000Z',
    ringingAt: '2026-10-15T10:00:01.000Z',
    answeredAt: '2026-10-15T10:00:02.000Z',
    endedAt: '2026-10-15T10:00:28.000Z',
  },
  durationSec: 26,
  variables: { name: 'Asha Verma' },
  outcome: { disposition: 'paid' },
  disposition: 'paid',
  languageDetected: 'hi',
  metrics: {
    latency: { p50Ms: 820, p95Ms: 1400, maxMs: 1600, samples: 4 },
    bargeIns: 1,
    silencePrompts: 0,
    aiSeconds: 0,
    ttsChars: 300,
    ttsCachedChars: 120,
  },
  cost: {
    telephonyMicros: 0,
    aiMicros: 0,
    ttsMicros: 600_000,
    commissionMicros: 295_000,
    totalMicros: 895_000,
  },
  recording: { durationSec: 26, sizeBytes: 793_004 },
  flowRunId: 'r1',
  error: null,
  createdAt: '2026-10-15T10:00:00.000Z',
  ...overrides,
});

export const fakeTranscript = (): CallTranscriptTurn[] => [
  {
    seq: 1,
    speaker: 'bot',
    text: 'Yeh call quality ke liye record ki ja rahi hai.',
    language: null,
    startMs: 0,
    endMs: 2800,
    interrupted: false,
    source: 'system',
  },
  {
    seq: 2,
    speaker: 'customer',
    text: '[1]',
    language: null,
    startMs: 9000,
    endMs: 9000,
    interrupted: false,
    source: 'dtmf',
  },
  {
    seq: 3,
    speaker: 'bot',
    text: 'Dhanyavaad, namaste.',
    language: 'hi',
    startMs: 12_000,
    endMs: 13_000,
    interrupted: true,
    source: 'tts',
  },
];

export const fakeEvents = (): CallEvent[] => [
  { seq: 1, type: 'status', data: { status: 'ringing' }, at: '2026-10-15T10:00:01.000Z' },
  {
    seq: 2,
    type: 'node_entered',
    data: { nodeId: 'greet', type: 'speak' },
    at: '2026-10-15T10:00:03.000Z',
  },
  { seq: 3, type: 'latency', data: { ms: 820 }, at: '2026-10-15T10:00:10.000Z' },
];
