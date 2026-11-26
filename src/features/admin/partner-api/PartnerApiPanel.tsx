import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { CopyButton } from '@/components/CopyButton';
import { getErrorMessage } from '@/services/api/errors';
import {
  partnerApi,
  type PartnerApiInfo,
  type PartnerEndpoint,
  type PartnerNumber,
  type PartnerScope,
  type PartnerTryResult,
} from '@/services/api/partner-api';

import { curlFor, filledPath, PARTNER_TEXTS } from './partner-api-texts';

const scopeKey = (scope: PartnerScope) =>
  scope.kind === 'admin' ? ['partner-api', 'admin', scope.accountId] : ['partner-api', 'full'];

const Mono = ({ children }: { children: string }) => (
  <Box
    component="pre"
    sx={{
      m: 0,
      p: 1,
      bgcolor: 'action.hover',
      borderRadius: 1,
      fontSize: 12,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    }}
  >
    {children}
  </Box>
);

/** Reveal for 60 s after the superadmin's own password (+ code); then masked again. */
function RevealKey({
  scope,
  number,
  onKey,
}: {
  scope: PartnerScope;
  number: PartnerNumber;
  onKey: (key: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [key, setKey] = useState<string | null>(null);
  const [left, setLeft] = useState(0);
  const reveal = useMutation({
    mutationFn: () =>
      partnerApi.reveal(scope, number.channelId, {
        password,
        ...(code.trim() ? { code: code.trim() } : {}),
      }),
    meta: { silent: true },
    onSuccess: (r) => {
      setKey(r.apiKey);
      setLeft(r.expiresInSec);
      onKey(r.apiKey);
      setOpen(false);
      setPassword('');
      setCode('');
    },
  });
  useEffect(() => {
    if (!key) return undefined;
    const timer = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          setKey(null);
          onKey(null);
          return 0;
        }
        return s - 1;
      });
    }, 1_000);
    return () => clearInterval(timer);
  }, [key, onKey]);
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      <Typography variant="body2">
        API key:{' '}
        <code aria-label="Partner API key">{key ?? `••••••••${number.keyLast4 ?? '????'}`}</code>
      </Typography>
      {key ? (
        <>
          <CopyButton value={key} label="Copy API key" />
          <Typography variant="caption" color="text.secondary">
            hides in {left} s
          </Typography>
        </>
      ) : (
        <Button size="small" onClick={() => setOpen(true)} disabled={!number.keyConfigured}>
          Reveal
        </Button>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reveal the partner API key</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {PARTNER_TEXTS.revealHelp}
            </Typography>
            <TextField
              label="Your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <TextField
              label="Two-step code (if set up)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            {reveal.error && <Alert severity="error">{getErrorMessage(reveal.error)}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!password || reveal.isPending}
            onClick={() => reveal.mutate()}
          >
            Reveal
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function EndpointRow({
  scope,
  info,
  number,
  endpoint,
  revealedKey,
}: {
  scope: PartnerScope;
  info: PartnerApiInfo;
  number: PartnerNumber;
  endpoint: PartnerEndpoint;
  revealedKey: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<PartnerTryResult | null>(null);
  const run = useMutation({
    mutationFn: () => partnerApi.tryIt(scope, number.channelId, endpoint.id),
    meta: { silent: true },
    onSuccess: setResult,
  });
  const curl = curlFor(endpoint, number, info, revealedKey);
  return (
    <Box
      component="li"
      sx={{ listStyle: 'none', borderBottom: 1, borderColor: 'divider', py: 1 }}
      aria-label={endpoint.id}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <Chip size="small" label={endpoint.method} />
        <Typography variant="body2" component="code" sx={{ wordBreak: 'break-all' }}>
          {filledPath(endpoint, number)}
        </Typography>
        {!endpoint.supported && (
          <Chip size="small" color="warning" variant="outlined" label={PARTNER_TEXTS.unsupported} />
        )}
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={() => setOpen((o) => !o)}>
          {open ? 'Hide' : 'Details'}
        </Button>
        {endpoint.tryIt && (
          <Button size="small" disabled={run.isPending} onClick={() => run.mutate()}>
            Try it
          </Button>
        )}
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {endpoint.summary}
      </Typography>
      {open && (
        <Stack spacing={1} sx={{ mt: 1 }}>
          {endpoint.notes && <Alert severity="info">{endpoint.notes}</Alert>}
          {endpoint.body && (
            <>
              <Typography variant="caption">Request body</Typography>
              <Mono>{JSON.stringify(endpoint.body, null, 2)}</Mono>
            </>
          )}
          {endpoint.response !== undefined && (
            <>
              <Typography variant="caption">Answer</Typography>
              <Mono>{JSON.stringify(endpoint.response, null, 2)}</Mono>
            </>
          )}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="caption">curl</Typography>
            <CopyButton value={curl} label={`Copy curl for ${endpoint.id}`} />
          </Stack>
          <Mono>{curl}</Mono>
        </Stack>
      )}
      {run.error && <Alert severity="error">{getErrorMessage(run.error)}</Alert>}
      {result && (
        <Stack spacing={0.5} sx={{ mt: 1 }} aria-label={`Result of ${endpoint.id}`}>
          <Typography variant="caption" color={result.ok ? 'success.main' : 'error'}>
            HTTP {result.httpStatus} · {result.durationMs} ms
          </Typography>
          <Mono>
            {typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)}
          </Mono>
        </Stack>
      )}
    </Box>
  );
}

/**
 * PIN: the Pinnacle partner API of an account's managed numbers — superadmins only (the backend
 * refuses everyone else). `channelId` limits it to one number.
 */
export function PartnerApiPanel({ scope, channelId }: { scope: PartnerScope; channelId?: string }) {
  const info = useQuery({
    queryKey: scopeKey(scope),
    queryFn: () => partnerApi.info(scope),
    meta: { silent: true },
  });
  const [group, setGroup] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [revealed, setRevealed] = useState<Record<string, string | null>>({});
  const numbers = useMemo(
    () =>
      (info.data?.numbers ?? []).filter(
        (n) => n.keyConfigured && (!channelId || n.channelId === channelId),
      ),
    [info.data, channelId],
  );
  if (info.isLoading) return <Skeleton height={160} />;
  if (info.error) return <Alert severity="error">{getErrorMessage(info.error)}</Alert>;
  const data = info.data;
  if (!data?.configured || !numbers.length) {
    return <Alert severity="info">{PARTNER_TEXTS.notConfigured}</Alert>;
  }
  const q = search.trim().toLowerCase();
  const endpoints = data.endpoints.filter(
    (e) =>
      (group === 'All' || e.group === group) &&
      (!q || `${e.path} ${e.summary} ${e.id}`.toLowerCase().includes(q)),
  );
  return (
    <Stack spacing={2} aria-label="Partner API (Pinnacle)" role="region">
      <Alert severity="warning">{PARTNER_TEXTS.superadminOnly}</Alert>
      <Stack spacing={0.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography variant="body2">
            Base URL: <code>{data.baseUrl}</code>
          </Typography>
          <CopyButton value={data.baseUrl} label="Copy base URL" />
        </Stack>
        <Typography variant="body2">
          Calls (voice) URL: <code>{data.voiceBaseUrl}</code> · Header{' '}
          <code>{data.authHeader}</code>
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Errors: <code>{JSON.stringify(data.errorFormat.example)}</code> — {data.errorFormat.note}
        </Typography>
      </Stack>
      {numbers.map((n) => (
        <Stack key={n.channelId} spacing={1}>
          <Typography variant="subtitle2">
            {n.label} · {n.displayPhoneNumber ?? n.phoneNumberId}
          </Typography>
          <Typography variant="body2">
            WABA <code>{n.wabaId}</code> · phone number id <code>{n.phoneNumberId}</code>
          </Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
            Our callback: <code>{n.webhook.url}</code> (header <code>{n.webhook.headerName}</code>)
          </Typography>
          <RevealKey
            scope={scope}
            number={n}
            onKey={(key) => setRevealed((r) => ({ ...r, [n.channelId]: key }))}
          />
        </Stack>
      ))}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Tabs
          value={group}
          onChange={(_e, v: string) => setGroup(v)}
          variant="scrollable"
          aria-label="Endpoint groups"
        >
          {['All', ...data.groups].map((g) => (
            <Tab key={g} value={g} label={g} />
          ))}
        </Tabs>
        <TextField
          size="small"
          label="Search endpoints"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Stack>
      {numbers.slice(0, 1).map((n) => (
        <Box key={n.channelId} component="ul" sx={{ m: 0, p: 0 }} aria-label="Endpoints">
          {endpoints.map((e) => (
            <EndpointRow
              key={e.id}
              scope={scope}
              info={data}
              number={n}
              endpoint={e}
              revealedKey={revealed[n.channelId] ?? null}
            />
          ))}
        </Box>
      ))}
    </Stack>
  );
}
