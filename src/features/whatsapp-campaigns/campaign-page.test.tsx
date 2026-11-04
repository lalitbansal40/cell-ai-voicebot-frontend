import { QueryClient } from '@tanstack/react-query';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { signInAs } from '@/test/auth';
import { fakeRealtime } from '@/test/realtime';
import { renderWithProviders } from '@/test/render';
import { fakeWaCampaign } from '@/test/whatsapp-campaigns';

import { api, offsetPage } from './test-setup';

vi.mock('@/services/api/whatsapp-campaigns', () => ({
  waCampaignsApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    estimate: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    retryFailed: vi.fn(),
    recipients: vi.fn(),
    report: vi.fn(),
    export: vi.fn(),
  },
}));
vi.mock('@/services/api/whatsapp', () => ({ whatsappApi: { channels: vi.fn() } }));
vi.mock('@/services/api/templates', () => ({ templatesApi: { list: vi.fn(), get: vi.fn() } }));
vi.mock('@/services/api/contact-lists', () => ({ contactListsApi: { list: vi.fn() } }));
vi.mock('@/services/api/segments', () => ({ segmentsApi: { list: vi.fn() } }));
vi.mock('@/services/api/custom-fields', () => ({ customFieldsApi: { list: vi.fn() } }));
vi.mock('@/services/api/contacts', () => ({
  contactsApi: { list: vi.fn(), get: vi.fn(), tags: vi.fn() },
}));
vi.mock('@/services/api/contact-imports', () => ({ contactImportsApi: { list: vi.fn() } }));

describe('WhatsApp campaign pages', () => {
  it('a WhatsApp-only custom role can open its campaign list but cannot create', async () => {
    signInAs('viewer', { permissions: ['whatsapp.campaigns.read', 'whatsapp.read'] });
    renderWithProviders({ route: '/campaigns?line=whatsapp' });
    expect(await screen.findByRole('link', { name: 'November reminders' })).toHaveAttribute(
      'href',
      '/campaigns/whatsapp/wc1',
    );
    expect(screen.queryByRole('link', { name: 'New WhatsApp campaign' })).not.toBeInTheDocument();
  });
  it('shows results and live authoritative pause reasons instead of trusting incomplete WS payloads', async () => {
    signInAs('manager');
    api.get.mockResolvedValue(fakeWaCampaign({ status: 'running' }));
    const realtime = fakeRealtime();
    renderWithProviders({ route: '/campaigns/whatsapp/wc1', realtime: realtime.client });
    await screen.findByRole('button', { name: 'Pause' });
    api.get.mockResolvedValue(fakeWaCampaign({ status: 'paused', pauseReason: 'wallet_empty' }));
    realtime.emit('whatsapp_campaign.progress', {
      campaignId: 'wc1',
      status: 'paused',
      counters: {},
    });
    expect(await screen.findByText('The wallet ran out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument();
    expect(screen.getByLabelText('total count')).toHaveTextContent('50');
  });
  it('pauses, resumes and requires confirmation before stopping', async () => {
    signInAs('manager');
    api.get.mockResolvedValue(fakeWaCampaign({ status: 'running' }));
    renderWithProviders({ route: '/campaigns/whatsapp/wc1' });
    fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Resume' }));
    await waitFor(() => expect(api.resume).toHaveBeenCalledWith('wc1'));
    fireEvent.click(await screen.findByRole('button', { name: 'Stop' }));
    expect(api.stop).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole('button', { name: 'Stop campaign' }));
    await waitFor(() => expect(api.stop).toHaveBeenCalledWith('wc1'));
  });
  it('shows masked recipients, status filters, report and retry result', async () => {
    signInAs('manager');
    const campaign = fakeWaCampaign({ status: 'completed' });
    campaign.counters.failedTotal = 2;
    api.get.mockResolvedValue(campaign);
    api.recipients.mockResolvedValue(
      offsetPage([
        {
          contactId: 'ct1',
          name: 'Customer',
          phone: '+91••••1234',
          variant: 'A',
          status: 'failed',
          skipReason: null,
          errorCode: 130429,
          sentAt: null,
          repliedAt: null,
        },
      ]),
    );
    renderWithProviders({ route: '/campaigns/whatsapp/wc1' });
    expect(await screen.findByText('+91••••1234')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry failed' }));
    expect(await screen.findByText('2 recipients queued for retry.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Report' }));
    expect(await screen.findByText('Winning variant: A')).toBeInTheDocument();
    expect(screen.getByText('Delivery funnel')).toBeInTheDocument();
  });
  it('read-only roles get no campaign control buttons and completed detail retains poll fallback', async () => {
    signInAs('agent');
    api.get.mockResolvedValue(fakeWaCampaign({ status: 'completed' }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithProviders({ route: '/campaigns/whatsapp/wc1', queryClient: client });
    await screen.findByRole('heading', { name: 'November reminders' });
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry failed' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit & start' })).not.toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('wc1');
  });
});
