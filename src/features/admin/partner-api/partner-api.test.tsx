import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { partnerApi, type PartnerApiInfo } from '@/services/api/partner-api';
import { signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

import { curlFor } from './partner-api-texts';
import { PartnerApiPanel } from './PartnerApiPanel';

vi.mock('@/services/api/partner-api', () => ({
  partnerApi: { info: vi.fn(), reveal: vi.fn(), tryIt: vi.fn() },
}));
const api = vi.mocked(partnerApi);

const info = (over: Partial<PartnerApiInfo> = {}): PartnerApiInfo => ({
  configured: true,
  baseUrl: 'https://partnersv1.pinbot.ai/v3',
  voiceBaseUrl: 'https://partnersv1.pinbot.ai/v3',
  authHeader: 'apikey',
  errorFormat: { example: { code: 400, status: 'failed' }, note: 'sometimes 200' },
  numbers: [
    {
      channelId: 'wa1',
      label: 'Cell',
      status: 'connected',
      wabaId: '1679634607044488',
      phoneNumberId: '1410290938839999',
      displayPhoneNumber: '+91 87797 21034',
      keyConfigured: true,
      keyLast4: 'ab12',
      keyCheckedAt: null,
      webhook: {
        url: 'https://x.test/api/v1/webhooks/pinnacle/wa1',
        headerName: 'x-cell-webhook-secret',
        setAt: null,
      },
    },
  ],
  groups: ['Key', 'Messages', 'Calling'],
  endpoints: [
    {
      id: 'key.details',
      group: 'Key',
      method: 'GET',
      path: '/getuserdetails',
      host: 'base',
      summary: 'The numbers this key may use',
      supported: true,
      tryIt: true,
    },
    {
      id: 'messages.text',
      group: 'Messages',
      method: 'POST',
      path: '/{phoneNumberId}/messages',
      host: 'base',
      summary: 'Send a text',
      body: { messaging_product: 'whatsapp', type: 'text' },
      supported: true,
      tryIt: false,
    },
    {
      id: 'calling.calls',
      group: 'Calling',
      method: 'POST',
      path: '/{phoneNumberId}/calls',
      host: 'voice',
      summary: 'Call actions',
      supported: false,
      tryIt: false,
    },
  ],
  ...over,
});

const show = () =>
  renderWithProviders({
    routes: [
      { path: '/', element: <PartnerApiPanel scope={{ kind: 'admin', accountId: 'a1' }} /> },
    ],
  });

beforeEach(() => {
  signInAs('owner');
  api.info.mockResolvedValue(info());
});
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('Partner API panel (PIN-T6)', () => {
  it('shows base URLs, ids, the callback, the masked key, the endpoints and unsupported calling', async () => {
    show();
    const panel = await screen.findByRole('region', { name: 'Partner API (Pinnacle)' });
    expect(within(panel).getAllByText('https://partnersv1.pinbot.ai/v3')[0]).toBeVisible();
    expect(within(panel).getByLabelText('Partner API key')).toHaveTextContent('••••••••ab12');
    expect(within(panel).getByText('/1410290938839999/messages')).toBeVisible();
    expect(within(panel).getByText('Not carried by the partner')).toBeVisible();
    await userEvent.click(within(panel).getByRole('tab', { name: 'Messages' }));
    expect(within(panel).queryByText('/getuserdetails')).toBeNull();
  });

  it('Reveal: password → the key for 60 s, then masked again', async () => {
    api.reveal.mockResolvedValue({
      apiKey: 'pin_live_secret_ab12',
      keyLast4: 'ab12',
      expiresInSec: 2,
    });
    show();
    await userEvent.click(await screen.findByRole('button', { name: 'Reveal' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reveal the partner API key' });
    await userEvent.type(within(dialog).getByLabelText('Your password'), 'my-own-pass');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reveal' }));
    await waitFor(() =>
      expect(api.reveal).toHaveBeenCalledWith({ kind: 'admin', accountId: 'a1' }, 'wa1', {
        password: 'my-own-pass',
      }),
    );
    expect(await screen.findByText('pin_live_secret_ab12')).toBeVisible();
    await waitFor(() => expect(screen.queryByText('pin_live_secret_ab12')).toBeNull(), {
      timeout: 4_000,
    });
    expect(screen.getByLabelText('Partner API key')).toHaveTextContent('••••••••ab12');
  });

  it('Try it shows the masked answer; writes have no Try it', async () => {
    api.tryIt.mockResolvedValue({
      endpointId: 'key.details',
      ok: true,
      httpStatus: 200,
      durationMs: 42,
      body: { data: [{ phone_number_id: '1410290938839999', wanumber: '…1034' }] },
    });
    show();
    const row = await screen.findByRole('listitem', { name: 'key.details' });
    await userEvent.click(within(row).getByRole('button', { name: 'Try it' }));
    expect(await within(row).findByText(/HTTP 200 · 42 ms/)).toBeVisible();
    expect(within(row).getByText(/…1034/)).toBeVisible();
    const write = screen.getByRole('listitem', { name: 'messages.text' });
    expect(within(write).queryByRole('button', { name: 'Try it' })).toBeNull();
    await act(async () => {
      await userEvent.click(within(write).getByRole('button', { name: 'Details' }));
    });
    expect(within(write).getByText(/\$PINNACLE_KEY/)).toBeVisible();
  });

  it('no key configured: says how to add one', async () => {
    api.info.mockResolvedValue(info({ configured: false, numbers: [] }));
    show();
    expect(await screen.findByText(/No partner API key configured/)).toBeVisible();
  });

  it('curl uses $PINNACLE_KEY until a key is revealed', () => {
    const i = info();
    const e = i.endpoints[1]!;
    const n = i.numbers[0]!;
    expect(curlFor(e, n, i, null)).toContain('apikey: $PINNACLE_KEY');
    expect(curlFor(e, n, i, 'pin_x')).toContain('apikey: pin_x');
    expect(curlFor(e, n, i, null)).toContain('/1410290938839999/messages');
  });
});
