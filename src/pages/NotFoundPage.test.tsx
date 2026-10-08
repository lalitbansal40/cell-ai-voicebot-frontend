import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/test/render';

describe('NotFoundPage', () => {
  it('renders 404 for an unknown route', () => {
    renderWithProviders({ route: '/does-not-exist' });
    expect(screen.getByRole('heading', { level: 1, name: '404' })).toBeInTheDocument();
  });

  it('links back to the home page', async () => {
    const user = userEvent.setup();
    renderWithProviders({ route: '/does-not-exist' });

    await user.click(screen.getByRole('link', { name: 'Go to home' }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cell AI Voicebot' }),
    ).toBeInTheDocument();
  });
});
