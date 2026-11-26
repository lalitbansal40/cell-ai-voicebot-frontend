import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { campaignsApi } from '@/services/api/campaigns';
import { signInAs } from '@/test/auth';
import { fakeCampaignContact } from '@/test/campaigns';
import { renderWithProviders } from '@/test/render';

import { ResultsTab } from './ResultsTab';

/** IVR-T4: key presses of a recorded-voice IVR campaign filter the results. */

vi.mock('@/services/api/campaigns', () => ({ campaignsApi: { contacts: vi.fn() } }));
const api = vi.mocked(campaignsApi);

const show = (ivrDigits?: Record<string, number>) =>
  renderWithProviders({
    routes: [{ path: '/', element: <ResultsTab campaignId="cp1" ivrDigits={ivrDigits} /> }],
  });

beforeEach(() => {
  vi.clearAllMocks();
  signInAs('owner');
  api.contacts.mockResolvedValue({
    success: true,
    data: [fakeCampaignContact()],
    meta: { hasMore: false, nextCursor: null },
  } as never);
});

describe('IVR key presses', () => {
  it('shows counts and shares; a bar and the select filter by key; Clear resets', async () => {
    const user = userEvent.setup();
    show({ '1': 6, '2': 2, none: 2 });
    const report = await screen.findByRole('region', { name: 'IVR key presses' });
    expect(report).toHaveTextContent('Pressed 1');
    expect(report).toHaveTextContent('6 · 60%');
    expect(report).toHaveTextContent('No key');
    await user.click(screen.getByRole('button', { name: 'Pressed 2: 2' }));
    await waitFor(() =>
      expect(api.contacts).toHaveBeenLastCalledWith('cp1', { limit: 50, digit: '2' }),
    );
    await user.click(screen.getByLabelText('Key pressed'));
    await user.click(screen.getByRole('option', { name: 'No key' }));
    await waitFor(() =>
      expect(api.contacts).toHaveBeenLastCalledWith('cp1', { limit: 50, digit: 'none' }),
    );
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(api.contacts).toHaveBeenLastCalledWith('cp1', { limit: 50 }));
  });

  it('is absent for other campaigns', async () => {
    show();
    await waitFor(() => expect(api.contacts).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'IVR key presses' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Key pressed')).not.toBeInTheDocument();
  });
});
