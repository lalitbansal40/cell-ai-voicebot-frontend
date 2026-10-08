import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getSystemInfo } from '@/services/api/system';
import { renderWithProviders } from '@/test/render';

vi.mock('@/services/api/system', () => ({ getSystemInfo: vi.fn() }));
vi.mocked(getSystemInfo).mockResolvedValue({
  name: 'cell-ai-voicebot-backend',
  version: '0.0.1',
  node: 'v24.19.0',
  env: 'test',
});

describe('HomePage', () => {
  it('shows the product heading', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByRole('heading', { level: 1, name: 'Cell AI Voicebot' })).toBeInTheDocument();
  });

  it('shows the phase 1 status line', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByText('Phase 1 — foundation ready')).toBeInTheDocument();
  });

  it('shows the API status card', async () => {
    renderWithProviders({ route: '/' });
    expect(await screen.findByText('cell-ai-voicebot-backend')).toBeInTheDocument();
  });
});
