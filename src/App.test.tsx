import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { App } from './App';

vi.mock('@/services/api/system', () => ({
  getSystemInfo: vi.fn(() =>
    Promise.resolve({
      name: 'cell-ai-voicebot-backend',
      version: '0.0.1',
      node: 'v24',
      env: 'test',
    }),
  ),
}));

describe('App', () => {
  it('renders the home page with all providers', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'Cell AI Voicebot' })).toBeInTheDocument();
    expect(await screen.findByText('cell-ai-voicebot-backend')).toBeInTheDocument();
  });
});
