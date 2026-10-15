import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { useState } from 'react';

import { usePermission, useSession } from '@/features/auth/hooks';
import { reloadMe } from '@/features/auth/session';
import { accountApi } from '@/services/api/account';
import { getErrorMessage } from '@/services/api/errors';
import type { PublicAccount } from '@/services/api/types';

const NOTICE_MAX = 200;

type Draft = { recordingEnabled: boolean; recordingNotice: string };
const draftOf = (a: PublicAccount): Draft => ({
  recordingEnabled: a.settings.recordingEnabled,
  recordingNotice: a.settings.recordingNotice,
});

/** Settings → Calls: call recording and the notice said at the start of every call. */
export function CallsTab() {
  const session = useSession();
  const canUpdate = usePermission('account.update');
  const account = session?.account;
  if (!account) return null;
  return (
    <CallsForm
      key={JSON.stringify(draftOf(account))}
      account={account}
      canEdit={canUpdate && account.status !== 'suspended' && !session.impersonation}
    />
  );
}

function CallsForm({ account, canEdit }: { account: PublicAccount; canEdit: boolean }) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(account));
  const save = useMutation({
    mutationFn: (d: Draft) =>
      accountApi.update({
        settings: {
          recordingEnabled: d.recordingEnabled,
          recordingNotice: d.recordingNotice.trim(),
        },
      }),
    meta: { silent: true },
    onSuccess: async () => {
      await reloadMe().catch(() => undefined);
      enqueueSnackbar('Call settings saved', { variant: 'success' });
    },
  });
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftOf(account));
  const notice = draft.recordingNotice.trim();
  const badNotice = draft.recordingEnabled && (notice.length === 0 || notice.length > NOTICE_MAX);
  return (
    <Paper variant="outlined" sx={{ p: 3 }} component="section" aria-label="Call settings">
      <Stack spacing={2} sx={{ maxWidth: 640 }}>
        {!canEdit && (
          <Alert severity="info">Only the owner and admins can change call settings.</Alert>
        )}
        {save.isError && <Alert severity="error">{getErrorMessage(save.error)}</Alert>}
        <FormControlLabel
          control={
            <Switch
              checked={draft.recordingEnabled}
              disabled={!canEdit}
              onChange={(e) => setDraft({ ...draft, recordingEnabled: e.target.checked })}
            />
          }
          label="Record calls"
        />
        <Typography variant="body2" color="text.secondary">
          Recordings are kept for the retention period (default 180 days), opened only with a
          5-minute link, and every opening is logged. Turned off, calls still keep their transcript
          and timeline.
        </Typography>
        <TextField
          label="Recording notice"
          helperText={
            badNotice
              ? `Required, at most ${String(NOTICE_MAX)} characters`
              : 'Said at the start of every recorded call, before the flow or agent speaks.'
          }
          error={badNotice}
          value={draft.recordingNotice}
          disabled={!canEdit || !draft.recordingEnabled}
          onChange={(e) => setDraft({ ...draft, recordingNotice: e.target.value })}
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: NOTICE_MAX + 50 } }}
        />
        {canEdit && (
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            <Button disabled={!dirty} onClick={() => setDraft(draftOf(account))}>
              Discard
            </Button>
            <Button
              variant="contained"
              disabled={!dirty || badNotice || save.isPending}
              onClick={() => save.mutate(draft)}
            >
              Save changes
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
