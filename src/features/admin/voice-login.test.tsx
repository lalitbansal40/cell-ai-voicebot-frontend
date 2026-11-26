import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AdminAccountDetail } from '@/services/api/types';
import type * as VoiceApiModule from '@/services/api/voice-api';
import {
  voiceAdminApi,
  type VoiceCredentials,
  type VoiceDiagnostics,
} from '@/services/api/voice-api';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

import { VoiceApiCard } from './VoiceApiCard';

/** Superadmin: an account's own Cell24x7 token, caller ID and webhook. */

vi.mock('@/services/api/voice-api', async (importOriginal) => ({
  ...(await importOriginal<typeof VoiceApiModule>()),
  voiceAdminApi: {
    ivrs: vi.fn(),
    setAccount: vi.fn(),
    setCredentials: vi.fn(),
    registerAccountWebhook: vi.fn(),
    diagnostics: vi.fn(),
    testConnection: vi.fn(),
    sendTestCall: vi.fn(),
    testCallResult: vi.fn(),
  },
}));
const api = vi.mocked(voiceAdminApi);

const creds = (over: Partial<VoiceCredentials> = {}): VoiceCredentials => ({
  mode: 'platform',
  tokenHint: null,
  callerId: null,
  verifiedAt: null,
  webhookRegisteredAt: null,
  checkError: null,
  ...over,
});
const show = (credentials: VoiceCredentials) =>
  renderWithProviders({
    routes: [
      {
        path: '/',
        element: (
          <VoiceApiCard
            detail={
              {
                account: { id: 'acc1' },
                voiceApi: { enabled: true, ivrIds: [], ivrEstimateSec: 60, credentials },
              } as unknown as AdminAccountDetail
            }
          />
        ),
      },
    ],
  });

const diag = (over: Partial<VoiceDiagnostics> = {}): VoiceDiagnostics => ({
  lastCheck: null,
  lastTestCall: null,
  lastShape: { details: null, webhook: null },
  unknownStatuses: [],
  noCredits24h: 0,
  incoming: 'not_available',
  audio: [{ id: 'aud1', name: 'EMI reminder', durationMs: 12_000 }],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('owner');
  api.ivrs.mockResolvedValue([]);
  api.diagnostics.mockResolvedValue(diag());
  api.setCredentials.mockResolvedValue(creds({ mode: 'own', tokenHint: '9876' }));
  api.registerAccountWebhook.mockResolvedValue(
    creds({ mode: 'own', tokenHint: '9876', webhookRegisteredAt: '2026-11-06T10:00:00Z' }),
  );
});

describe('Cell24x7 login per account', () => {
  it('switches to the account’s own token with a caller ID', async () => {
    show(creds());
    const login = await screen.findByRole('region', { name: 'Cell24x7 login' });
    expect(within(login).getByText('Platform token')).toBeInTheDocument();
    await userEvent.click(within(login).getByDisplayValue('own'));
    const save = within(login).getByRole('button', { name: 'Check and save login' });
    expect(save).toBeDisabled(); // no token yet
    await userEvent.type(within(login).getByLabelText('API token'), 'tok-9876');
    await userEvent.type(within(login).getByLabelText('Caller ID (10 digits)'), '9876543210');
    await userEvent.click(save);
    await waitFor(() =>
      expect(api.setCredentials).toHaveBeenCalledWith('acc1', {
        mode: 'own',
        token: 'tok-9876',
        callerId: '9876543210',
      }),
    );
  });

  it('a saved own token: masked, webhook warning, register webhook', async () => {
    show(creds({ mode: 'own', tokenHint: '9876', callerId: '9876543210' }));
    const login = await screen.findByRole('region', { name: 'Cell24x7 login' });
    expect(within(login).getByText('Own token ••••9876')).toBeInTheDocument();
    expect(within(login).getByText('Webhook not registered')).toBeInTheDocument();
    expect(screen.queryByLabelText('IVR menus this account may use')).not.toBeInTheDocument();
    await userEvent.click(within(login).getByRole('button', { name: 'Register webhook' }));
    await waitFor(() => expect(api.registerAccountWebhook).toHaveBeenCalledWith('acc1'));
  });
});

describe('Cell24x7 checks (IVR)', () => {
  it('tests the connection and shows why it failed; says incoming is not available', async () => {
    api.testConnection.mockResolvedValue({
      ok: false,
      reason: 'auth',
      httpStatus: 401,
      ivrs: null,
      at: '2026-11-26T10:00:00Z',
    });
    show(creds());
    const panel = await screen.findByRole('region', { name: 'Cell24x7 checks' });
    expect(
      within(panel).getByText(/Incoming calls: not available on Cell24x7/),
    ).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Test connection' }));
    expect(
      await within(panel).findByText(/Cell24x7 refused the API key \(HTTP 401\)/),
    ).toBeInTheDocument();
    expect(api.testConnection).toHaveBeenCalledWith('acc1');
  });

  it("sends a test call only with the owner's OK and a valid mobile", async () => {
    api.sendTestCall.mockResolvedValue({
      requestId: 'r1',
      phoneLast4: '3215',
      content: 'audio',
      at: '2026-11-26T10:00:00Z',
    });
    show(creds());
    const panel = await screen.findByRole('region', { name: 'Cell24x7 checks' });
    await waitFor(() =>
      expect(within(panel).getByRole('button', { name: 'Send test call' })).toBeEnabled(),
    );
    await userEvent.click(within(panel).getByRole('button', { name: 'Send test call' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(within(dialog).getByLabelText('Mobile number (10 digits)'), '9876543215');
    const send = within(dialog).getByRole('button', { name: 'Send test call' });
    expect(send).toBeDisabled();
    await userEvent.click(
      within(dialog).getByLabelText('The account owner agreed to this test call'),
    );
    expect(send).toBeEnabled();
    await userEvent.click(send);
    await waitFor(() =>
      expect(api.sendTestCall).toHaveBeenCalledWith('acc1', {
        phone: '9876543215',
        content: { kind: 'audio', flowAudioId: 'aud1' },
        ownerApproved: true,
      }),
    );
  });

  it('shows the last test call result, the provider field shape, 402s and unknown statuses', async () => {
    api.diagnostics.mockResolvedValue(
      diag({
        lastTestCall: {
          requestId: 'r1',
          phoneLast4: '3215',
          content: 'ivr',
          at: '2026-11-26T10:00:00Z',
        },
        lastShape: {
          details: {
            source: 'details',
            keys: ['receiver', 'status', 'dtmf'],
            statusValues: ['ANSWERED'],
            sample: [{ receiver: '…3215', status: 'ANSWERED' }],
            at: '2026-11-26T10:01:00Z',
          },
          webhook: null,
        },
        noCredits24h: 2,
        unknownStatuses: ['RINGING_LONG'],
      }),
    );
    api.testCallResult.mockResolvedValue({
      test: { requestId: 'r1', phoneLast4: '3215', content: 'ivr', at: '2026-11-26T10:00:00Z' },
      result: {
        status: 'ANSWERED',
        durationSec: 21,
        retryCount: 0,
        keyPressed: '1',
        ivrDisposition: null,
      },
    });
    show(creds());
    const panel = await screen.findByRole('region', { name: 'Cell24x7 checks' });
    expect(await within(panel).findByText('Fields: receiver, status, dtmf')).toBeInTheDocument();
    expect(within(panel).getByText(/no credits” 2 time/)).toBeInTheDocument();
    expect(within(panel).getByText('RINGING_LONG')).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Refresh result' }));
    expect(await within(panel).findByText(/ANSWERED, 21 s, key pressed "1"/)).toBeInTheDocument();
  });
});
