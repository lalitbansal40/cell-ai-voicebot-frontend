import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

/** Absolute time in the account timezone (ADR 0017), e.g. "08 Oct 2026, 14:05". */
export const formatInAccountTz = (iso: string, timezone: string): string =>
  format(new TZDate(iso, timezone), 'dd MMM yyyy, HH:mm');
