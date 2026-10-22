import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { AuthLayout } from '@/features/auth/AuthLayout';
import { metaPublicApi } from '@/services/api/meta-public';

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

/** Public `/data-deletion` (Meta's data deletion callback URL + status lookup by `?code=`). */
export function DataDeletionPage() {
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const status = useQuery({
    queryKey: ['meta', 'data-deletion', code],
    queryFn: () => metaPublicApi.deletionStatus(code),
    enabled: Boolean(code),
    retry: false,
    meta: { silent: true },
  });

  return (
    <AuthLayout title="Data deletion">
      <Stack spacing={2}>
        {code && status.isPending && <Skeleton height={48} />}
        {status.data && (
          <Alert severity={status.data.status === 'completed' ? 'success' : 'info'}>
            Request <strong>{code}</strong>:{' '}
            {status.data.status === 'completed'
              ? `completed ${status.data.completedAt ? when(status.data.completedAt) : ''}`
              : `received ${when(status.data.receivedAt)} — being processed`}
            .
          </Alert>
        )}
        {status.isError && (
          <Alert severity="warning">We couldn&apos;t find a deletion request with that code.</Alert>
        )}
        <Typography variant="body2">
          When a business connects WhatsApp to Cell AI Voicebot through Facebook, we store from
          Meta: an access token for the connected WhatsApp Business Account (encrypted), the account
          and phone number ids and details (names, statuses, quality), and the WhatsApp webhook
          events Meta sends for those numbers (kept up to 30 days).
        </Typography>
        <Typography variant="body2">
          To delete this data, remove the Cell AI Voicebot app in your Facebook settings (Settings
          &amp; privacy → Settings → Business integrations) — Meta then sends us a deletion request
          and we delete the tokens and your Meta user id, and the numbers stop syncing. You can also
          email support from your account owner&apos;s address. Business records of a customer
          account are deleted with that account.
        </Typography>
      </Stack>
    </AuthLayout>
  );
}
