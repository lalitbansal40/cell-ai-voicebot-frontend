import {
  Alert,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { getErrorMessage } from '@/services/api/errors';
import {
  voiceAdminApi,
  voiceApiKeys,
  type VoiceDiagnostics,
  type VoiceTestCallResult,
} from '@/services/api/voice-api';

import { CHECK_REASON, INCOMING_NOTE } from './voice-texts';

const when = (iso: string) => new Date(iso).toLocaleString('en-IN');

function TestCallDialog({
  accountId,
  audio,
  ivrIds,
  onClose,
}: {
  accountId: string;
  audio: VoiceDiagnostics['audio'];
  ivrIds: number[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState('');
  const [kind, setKind] = useState<'audio' | 'ivr'>(audio.length ? 'audio' : 'ivr');
  const [audioId, setAudioId] = useState(audio[0]?.id ?? '');
  const [ivrId, setIvrId] = useState(ivrIds[0] ? String(ivrIds[0]) : '');
  const [ownerOk, setOwnerOk] = useState(false);
  const digits = phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  const phoneBad = phone.trim() !== '' && !/^[6-9]\d{9}$/.test(digits);
  const ivrNum = Number(ivrId);
  const contentBad = kind === 'audio' ? !audioId : !(Number.isInteger(ivrNum) && ivrNum > 0);
  const send = useMutation({
    mutationFn: () =>
      voiceAdminApi.sendTestCall(accountId, {
        phone: digits,
        content: kind === 'audio' ? { kind, flowAudioId: audioId } : { kind, ivrId: ivrNum },
        ownerApproved: ownerOk,
      }),
    meta: { silent: true },
    onSuccess: () => {
      enqueueSnackbar('Test call sent — press Refresh result in a minute', { variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: voiceApiKeys.diagnostics(accountId) });
      onClose();
    },
  });
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Send test call</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            One real call through Cell24x7 (its credits). Not charged to the wallet. At most 3 an
            hour.
          </Typography>
          <TextField
            label="Mobile number (10 digits)"
            size="small"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={phoneBad}
            helperText={phoneBad ? 'A 10-digit Indian mobile number' : ' '}
            autoFocus
          />
          <RadioGroup row value={kind} onChange={(e) => setKind(e.target.value as 'audio' | 'ivr')}>
            <FormControlLabel value="audio" control={<Radio size="small" />} label="Audio" />
            <FormControlLabel value="ivr" control={<Radio size="small" />} label="IVR" />
          </RadioGroup>
          {kind === 'audio' ? (
            <TextField
              select
              label="Audio file"
              size="small"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
              helperText={audio.length ? ' ' : 'This account has no audio yet'}
            >
              {audio.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.name} ({Math.round(a.durationMs / 1000)} s)
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              label="IVR id"
              size="small"
              type="number"
              value={ivrId}
              onChange={(e) => setIvrId(e.target.value)}
              helperText={ivrIds.length ? `Allowed: ${ivrIds.join(', ')}` : 'A runnable IVR id'}
            />
          )}
          <FormControlLabel
            control={<Checkbox checked={ownerOk} onChange={(_e, v) => setOwnerOk(v)} />}
            label="The account owner agreed to this test call"
          />
          {send.error && <Alert severity="error">{getErrorMessage(send.error)}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!ownerOk || phoneBad || !digits || contentBad || send.isPending}
          onClick={() => send.mutate()}
        >
          Send test call
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ShapeRow({
  title,
  shape,
}: {
  title: string;
  shape: VoiceDiagnostics['lastShape']['details'];
}) {
  if (!shape) return null;
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2">
        <strong>{title}</strong> · {when(shape.at)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Fields: {shape.keys.join(', ') || '—'}
      </Typography>
      {shape.statusValues.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          Statuses: {shape.statusValues.join(', ')}
        </Typography>
      )}
      {shape.sample !== undefined && (
        <Typography
          component="pre"
          variant="caption"
          sx={{ m: 0, p: 1, bgcolor: 'action.hover', borderRadius: 1, overflowX: 'auto' }}
        >
          {JSON.stringify(shape.sample, null, 2)}
        </Typography>
      )}
    </Stack>
  );
}

/** IVR: Test connection, Send test call, the last provider answer — superadmin only. */
export function VoiceDiagnosticsPanel({
  accountId,
  ivrIds,
}: {
  accountId: string;
  ivrIds: number[];
}) {
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [result, setResult] = useState<VoiceTestCallResult | null>(null);
  const diag = useQuery({
    queryKey: voiceApiKeys.diagnostics(accountId),
    queryFn: () => voiceAdminApi.diagnostics(accountId),
  });
  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: voiceApiKeys.diagnostics(accountId) });
  const test = useMutation({
    mutationFn: () => voiceAdminApi.testConnection(accountId),
    meta: { silent: true },
    onSettled: refresh,
  });
  const readResult = useMutation({
    mutationFn: () => voiceAdminApi.testCallResult(accountId),
    meta: { silent: true },
    onSuccess: (r) => {
      setResult(r);
      refresh();
    },
  });
  const d = diag.data;
  const check = test.data ?? d?.lastCheck ?? null;
  return (
    <Stack spacing={1.5} component="section" aria-label="Cell24x7 checks">
      <Typography variant="subtitle2" component="h3">
        Checks
      </Typography>
      {check && (
        <Alert severity={check.ok ? 'success' : 'error'}>
          {CHECK_REASON[check.reason]}
          {check.httpStatus ? ` (HTTP ${String(check.httpStatus)})` : ''}
          {check.ok && check.ivrs !== null ? ` · ${String(check.ivrs)} IVR menus` : ''} ·{' '}
          {when(check.at)}
        </Alert>
      )}
      {test.error && <Alert severity="error">{getErrorMessage(test.error)}</Alert>}
      {diag.error && <Alert severity="warning">{getErrorMessage(diag.error)}</Alert>}
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button disabled={test.isPending} onClick={() => test.mutate()}>
          Test connection
        </Button>
        <Button disabled={!d} onClick={() => setDialog(true)}>
          Send test call
        </Button>
        {d?.lastTestCall && (
          <Button disabled={readResult.isPending} onClick={() => readResult.mutate()}>
            Refresh result
          </Button>
        )}
      </Stack>
      {d?.lastTestCall && (
        <Typography variant="body2" color="text.secondary">
          Last test call: ••{d.lastTestCall.phoneLast4} ({d.lastTestCall.content}) ·{' '}
          {when(d.lastTestCall.at)}
          {result?.result
            ? ` — ${result.result.status}, ${String(result.result.durationSec)} s${
                result.result.keyPressed ? `, key pressed "${result.result.keyPressed}"` : ''
              }`
            : result
              ? ' — no result yet'
              : ''}
        </Typography>
      )}
      {readResult.error && <Alert severity="error">{getErrorMessage(readResult.error)}</Alert>}
      {d && d.noCredits24h > 0 && (
        <Alert severity="warning">
          Cell24x7 answered “no credits” {String(d.noCredits24h)} time(s) in the last 24 h.
        </Alert>
      )}
      {d && d.unknownStatuses.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2">Unknown provider statuses:</Typography>
          {d.unknownStatuses.map((s) => (
            <Chip key={s} size="small" color="warning" label={s} />
          ))}
        </Stack>
      )}
      {d && (d.lastShape.details || d.lastShape.webhook) && (
        <Stack spacing={1} aria-label="Last provider answer">
          <Typography variant="subtitle2" component="h4">
            Last provider answer
          </Typography>
          <ShapeRow title="Results (/details or poll)" shape={d.lastShape.details} />
          <ShapeRow title="Webhook" shape={d.lastShape.webhook} />
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        {INCOMING_NOTE}
      </Typography>
      {dialog && d && (
        <TestCallDialog
          accountId={accountId}
          audio={d.audio}
          ivrIds={ivrIds}
          onClose={() => setDialog(false)}
        />
      )}
    </Stack>
  );
}
