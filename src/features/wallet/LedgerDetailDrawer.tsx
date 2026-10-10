import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';

import type { LedgerEntry } from '@/services/api/types';
import { formatInAccountTz } from '@/utils/datetime';
import { formatCurrencyMicros, formatNumber } from '@/utils/format';

import {
  formatSeconds,
  LEDGER_STATUS_LABELS,
  LEDGER_TYPE_LABELS,
  signedAmount,
} from './ledger-format';

const REF_LABELS: Record<LedgerEntry['ref']['type'], string> = {
  call: 'Call',
  campaign: 'Campaign',
  topup: 'Top-up order',
  manual: 'Manual (support)',
  simulator: 'Simulated call',
  usage: 'Usage',
  seed: 'Demo data',
};

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right', wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Stack>
  );
}

const USAGE_KIND_LABELS: Record<'playground' | 'kb_ingest' | 'call', string> = {
  playground: 'AI playground turn',
  kb_ingest: 'Knowledge processing',
  call: 'Call',
};

/** One ledger row in full: amounts, call breakdown (billable seconds, pulse, parts), refs. */
export function LedgerDetailDrawer({
  entry,
  open,
  timezone,
  onClose,
}: {
  /** Kept while closing so the drawer slides out with its content. */
  entry: LedgerEntry | null;
  open: boolean;
  timezone: string;
  onClose: () => void;
}) {
  const b = entry?.breakdown;
  return (
    <Drawer anchor="right" open={open && Boolean(entry)} onClose={onClose}>
      {entry && (
        <Box
          sx={{ width: { xs: '100vw', sm: 400 }, p: 3 }}
          role="region"
          aria-label="Transaction details"
        >
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{entry.description}</Typography>
            <IconButton aria-label="Close details" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <Typography variant="h5" sx={{ my: 1, fontWeight: 600 }}>
            {signedAmount(entry)}
          </Typography>
          <Stack spacing={1}>
            <Row label="Date" value={formatInAccountTz(entry.createdAt, timezone)} />
            <Row label="Type" value={LEDGER_TYPE_LABELS[entry.type]} />
            <Row label="Status" value={LEDGER_STATUS_LABELS[entry.status]} />
            {entry.balanceAfterMicros !== null && (
              <Row label="Balance after" value={formatCurrencyMicros(entry.balanceAfterMicros)} />
            )}
            {entry.status === 'released' && (
              <Row
                label="Released"
                value={`${entry.releasedAt ? formatInAccountTz(entry.releasedAt, timezone) : ''} (${entry.releaseReason === 'settled' ? 'call ended, charged separately' : (entry.releaseReason ?? '—')})`}
              />
            )}
            {entry.note && <Row label="Reason" value={entry.note} />}
            {entry.createdBy && <Row label="By" value={entry.createdBy.name ?? 'Support'} />}
          </Stack>
          {b && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                How this was priced
              </Typography>
              <Stack spacing={1}>
                {b.answered !== undefined && (
                  <Row label="Answered" value={b.answered ? 'Yes' : 'No'} />
                )}
                {b.durationSec !== undefined && (
                  <Row label="Call length" value={formatSeconds(b.durationSec)} />
                )}
                {b.billableSeconds !== undefined && (
                  <Row
                    label="Billed time"
                    value={`${formatSeconds(b.billableSeconds)}${b.pulseSeconds ? ` (${b.pulseSeconds} s pulses)` : ''}`}
                  />
                )}
                {b.telephonyMicros !== undefined && (
                  <Row label="Telephony" value={formatCurrencyMicros(b.telephonyMicros)} />
                )}
                {b.aiMicros !== undefined && (
                  <Row
                    label="AI conversation"
                    value={`${formatCurrencyMicros(b.aiMicros)}${b.aiSeconds ? ` (${formatSeconds(b.aiSeconds)})` : ''}`}
                  />
                )}
                {b.ttsMicros !== undefined && (
                  <Row
                    label="AI voice (TTS)"
                    value={`${formatCurrencyMicros(b.ttsMicros)}${b.ttsChars ? ` (${formatNumber(b.ttsChars)} characters)` : ''}`}
                  />
                )}
                {b.kind && <Row label="Used for" value={USAGE_KIND_LABELS[b.kind]} />}
                {b.model && <Row label="AI model" value={b.model} />}
                {(b.inputTokens !== undefined || b.outputTokens !== undefined) && (
                  <Row
                    label="Text tokens"
                    value={`${formatNumber(b.inputTokens ?? 0)} in · ${formatNumber(b.outputTokens ?? 0)} out`}
                  />
                )}
                {b.embeddingTokens !== undefined && (
                  <Row label="Embedding tokens" value={formatNumber(b.embeddingTokens)} />
                )}
                {Boolean(b.commissionMicros) && (
                  <Row
                    label="Platform commission"
                    value={formatCurrencyMicros(b.commissionMicros ?? 0)}
                  />
                )}
              </Stack>
            </>
          )}
          <Divider sx={{ my: 2 }} />
          <Stack spacing={1}>
            <Row label="Source" value={`${REF_LABELS[entry.ref.type]} · ${entry.ref.id}`} />
            {entry.holdId && <Row label="Hold" value={entry.holdId} />}
            <Row label="Entry id" value={entry.id} />
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}
