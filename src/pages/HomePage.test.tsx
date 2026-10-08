import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

describe('HomePage', () => {
  it('shows the product heading', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByRole('heading', { level: 1, name: 'Cell AI Voicebot' })).toBeInTheDocument();
  });

  it('shows the phase 0 status line', () => {
    renderWithProviders({ route: '/' });
    expect(screen.getByText('Phase 0 — setup ready')).toBeInTheDocument();
  });
});
