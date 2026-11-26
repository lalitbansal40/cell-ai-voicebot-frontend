import type { VoiceLastCheck } from '@/services/api/voice-api';

/** Plain words for the reason of the last Test connection. */
export const CHECK_REASON: Record<VoiceLastCheck['reason'], string> = {
  ok: 'Reachable, key valid',
  timeout: 'No answer from Cell24x7 (timeout)',
  dns: 'The Cell24x7 address could not be found (DNS)',
  tls: 'A secure connection to Cell24x7 failed (TLS)',
  refused: 'Cell24x7 refused the connection',
  network: 'Network error reaching Cell24x7',
  auth: 'Cell24x7 refused the API key',
  no_credits: 'No Cell24x7 credits left',
  error: 'Cell24x7 answered with an error',
};

export const INCOMING_NOTE =
  'Incoming calls: not available on Cell24x7 — incoming calls come in on your phone line (SIP) or WhatsApp.';
