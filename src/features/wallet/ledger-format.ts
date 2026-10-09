import type { LedgerEntry } from '@/services/api/types';
import type { LedgerType } from '@/services/api/wallet';
import { formatCurrencyMicros } from '@/utils/format';

/** Same words as the API's descriptions. */
export const LEDGER_TYPE_LABELS: Record<LedgerType, string> = {
  topup: 'Wallet recharge',
  call_charge: 'Call charge',
  ai_charge: 'AI usage',
  tts_charge: 'Voice (TTS) usage',
  adjustment: 'Adjustment',
  refund: 'Refund',
  subscription: 'Subscription',
  recording_charge: 'Recording storage',
};

export const LEDGER_STATUS_LABELS: Record<LedgerEntry['status'], string> = {
  held: 'On hold',
  captured: 'Done',
  released: 'Released',
};

/** `+₹1,000.00` for credits, `−₹2.00` for debits (true minus sign). */
export const signedAmount = (e: Pick<LedgerEntry, 'direction' | 'amountMicros'>): string =>
  `${e.direction === 'credit' ? '+' : '−'}${formatCurrencyMicros(e.amountMicros)}`;

/** `1 min 30 s` / `45 s`. */
export const formatSeconds = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!m) return `${s} s`;
  return s ? `${m} min ${s} s` : `${m} min`;
};
