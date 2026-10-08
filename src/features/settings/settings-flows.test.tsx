import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/store';
import { accountApi } from '@/services/api/account';
import { apiKeysApi } from '@/services/api/api-keys';
import type * as ApiKeysModule from '@/services/api/api-keys';
import { auditApi } from '@/services/api/audit';
import { authApi } from '@/services/api/auth';
import { ApiError } from '@/services/api/errors';
import { fakeSession, signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

vi.mock('@/services/api/account', () => ({
  accountApi: { get: vi.fn(), update: vi.fn(), updateProfile: vi.fn() },
}));
vi.mock('@/services/api/api-keys', async (orig) => ({
  ...(await orig<typeof ApiKeysModule>()),
  apiKeysApi: { list: vi.fn(), create: vi.fn(), revoke: vi.fn() },
}));
vi.mock('@/services/api/audit', () => ({ auditApi: { list: vi.fn() } }));
vi.mock('@/services/api/auth', () => ({
  authApi: {
    sessions: vi.fn(),
    revokeSession: vi.fn(),
    logoutAll: vi.fn(),
    changePassword: vi.fn(),
    me: vi.fn(),
    refresh: vi.fn(() => Promise.reject(new Error('x'))),
  },
}));

afterEach(() => vi.clearAllMocks());

const KEY = {
  id: 'k1',
  name: 'CRM sync',
  prefix: 'cav_test_ABCD',
  scopes: ['calls:read'],
  lastUsedAt: null,
  revokedAt: null,
  createdBy: 'u1',
  createdAt: '2026-10-08T00:00:00Z',
};

describe('API keys tab', () => {
  it('revokes a key after confirming; revoked keys have no action', async () => {
    signInAs('owner');
    vi.mocked(apiKeysApi.list).mockResolvedValue([
      KEY,
      { ...KEY, id: 'k2', name: 'Old', revokedAt: '2026-10-08T00:00:00Z' },
    ]);
    vi.mocked(apiKeysApi.revoke).mockResolvedValue(undefined);
    renderWithProviders({ route: '/settings/api-keys' });
    expect(await screen.findAllByText('cav_test_ABCD…', { exact: false })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Revoke' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Revoke "CRM sync"?' })).getByRole('button', {
        name: 'Revoke',
      }),
    );
    await waitFor(() => expect(apiKeysApi.revoke).toHaveBeenCalledWith('k1'));
    expect(await screen.findByText('API key revoked')).toBeInTheDocument();
  });

  it('hides create / revoke while impersonating and shows errors', async () => {
    signInAs('owner', {
      impersonation: { impersonatorId: 'sa', expiresAt: '2026-10-08T01:00:00Z' },
    });
    vi.mocked(apiKeysApi.list).mockRejectedValue(
      new ApiError({ status: 0, code: 'NETWORK_ERROR', kind: 'network', message: 'x' }),
    );
    renderWithProviders({ route: '/settings/api-keys' });
    expect(
      await screen.findByText("Can't reach the server. Check your connection."),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create API key' })).not.toBeInTheDocument();
  });

  it('cancels the create dialog and shows server errors', async () => {
    signInAs('admin');
    vi.mocked(apiKeysApi.list).mockResolvedValue([]);
    vi.mocked(apiKeysApi.create).mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT_INVALID_STATE',
        kind: 'http',
        message: 'At most 20 keys.',
      }),
    );
    renderWithProviders({ route: '/settings/api-keys' });
    expect(await screen.findByText('No API keys yet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Create API key' }));
    await userEvent.type(screen.getByLabelText('Name'), 'X');
    await userEvent.click(screen.getByRole('checkbox', { name: /webhooks:manage/ }));
    await userEvent.click(screen.getByRole('checkbox', { name: /webhooks:manage/ }));
    expect(screen.getByRole('button', { name: 'Create key' })).toBeDisabled();
    await userEvent.click(screen.getByRole('checkbox', { name: /calls:write/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }));
    expect(await screen.findByText('At most 20 keys.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Account tab', () => {
  it('discards changes and blocks an invalid calling window', async () => {
    signInAs('owner');
    renderWithProviders({ route: '/settings/account' });
    const name = await screen.findByLabelText('Business name');
    await userEvent.type(name, ' X');
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(name).toHaveValue('Demo Finance');
    const from = screen.getByLabelText('From');
    await userEvent.clear(from);
    await userEvent.type(from, '20:00');
    expect(screen.getByText('Must be after the start')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  });

  it('edits language, country, switches; shows save errors', async () => {
    signInAs('admin');
    vi.mocked(accountApi.update).mockRejectedValue(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', kind: 'http', message: 'Server broke' }),
    );
    renderWithProviders({ route: '/settings/account' });
    const country = await screen.findByLabelText('Country (ISO code)');
    await userEvent.clear(country);
    await userEvent.type(country, 'ae');
    expect(country).toHaveValue('AE');
    await userEvent.click(screen.getByLabelText('Record calls'));
    await userEvent.click(
      screen.getByLabelText('Tell callers they are speaking with an AI assistant'),
    );
    await userEvent.click(screen.getByLabelText('Default call language'));
    await userEvent.click(screen.getByRole('option', { name: 'English' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Server broke')).toBeInTheDocument();
    expect(accountApi.update).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'AE', defaultLanguage: 'en' }) as unknown,
    );
  });

  it('is read-only for suspended accounts', async () => {
    const base = fakeSession('owner');
    signInAs('owner', { account: { ...base.account, status: 'suspended' } });
    renderWithProviders({ route: '/settings/account' });
    expect(await screen.findByLabelText('Business name')).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument();
  });
});

describe('Security tab', () => {
  it('validates the new password and shows server errors', async () => {
    signInAs('agent');
    vi.mocked(authApi.sessions).mockResolvedValue([]);
    vi.mocked(authApi.changePassword).mockRejectedValue(
      new ApiError({
        status: 401,
        code: 'AUTH_INVALID_CREDENTIALS',
        kind: 'http',
        message: 'Invalid email or password.',
      }),
    );
    renderWithProviders({ route: '/settings/security' });
    await userEvent.type(await screen.findByLabelText('Current password'), 'wrong-password-1');
    await userEvent.type(screen.getByLabelText('New password'), 'green-falcon-lake-77');
    await userEvent.type(screen.getByLabelText('Repeat new password'), 'green-falcon-lake-7');
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Repeat new password'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument();
  });

  it('signs out everywhere after confirming; revoking this session signs out', async () => {
    signInAs('agent');
    vi.mocked(authApi.sessions).mockResolvedValue([
      {
        id: 's1',
        userAgent: null,
        ip: null,
        createdAt: '2026-10-08T00:00:00Z',
        lastUsedAt: '2026-10-08T00:00:00Z',
        current: true,
      },
    ]);
    vi.mocked(authApi.revokeSession).mockResolvedValue(undefined);
    renderWithProviders({ route: '/settings/security' });
    expect(await screen.findByText('Unknown device')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('anonymous');
  });

  it('sign out everywhere', async () => {
    signInAs('agent');
    vi.mocked(authApi.sessions).mockResolvedValue([]);
    vi.mocked(authApi.logoutAll).mockResolvedValue(undefined);
    renderWithProviders({ route: '/settings/security' });
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out everywhere' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Sign out everywhere' }),
    );
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(authApi.logoutAll).toHaveBeenCalled();
  });

  it('explains that password changes are off while impersonating', async () => {
    signInAs('owner', { impersonation: { impersonatorId: 'sa', expiresAt: 'x' } });
    renderWithProviders({ route: '/settings/security' });
    expect(
      await screen.findByText('Password changes are not available while viewing as another user.'),
    ).toBeInTheDocument();
    expect(authApi.sessions).not.toHaveBeenCalled();
  });
});

describe('Profile + audit tabs', () => {
  it('shows server field errors and clears the phone', async () => {
    signInAs('agent', { user: { ...fakeSession('agent').user, phone: '+919876543210' } });
    vi.mocked(accountApi.updateProfile)
      .mockRejectedValueOnce(
        new ApiError({
          status: 422,
          code: 'VALIDATION_FAILED',
          kind: 'http',
          message: 'x',
          details: [{ path: 'body.name', message: 'Too long' }],
        }),
      )
      .mockResolvedValueOnce({ ...fakeSession('agent'), accessToken: undefined } as never);
    renderWithProviders({ route: '/settings/profile' });
    await userEvent.click(await screen.findByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Too long')).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Phone'));
    await userEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    await waitFor(() =>
      expect(accountApi.updateProfile).toHaveBeenLastCalledWith({
        name: 'Asha Verma',
        phone: null,
      }),
    );
  });

  it('filters the audit log by group and shows actor types', async () => {
    signInAs('owner');
    vi.mocked(auditApi.list).mockResolvedValue({
      success: true,
      data: [
        {
          id: 'e1',
          action: 'apikey.created',
          actor: { type: 'api_key', id: 'k', name: null, impersonatorId: null, platform: false },
          target: null,
          meta: null,
          ip: '1.2.3.4',
          at: '2026-10-08T00:00:00Z',
        },
        {
          id: 'e2',
          action: 'account.suspended',
          actor: { type: 'user', id: 'sa', name: null, impersonatorId: null, platform: true },
          target: null,
          meta: { reason: 'x', fields: ['a', 'b'] },
          ip: null,
          at: '2026-10-08T00:00:00Z',
        },
        {
          id: 'e3',
          action: 'team.invited',
          actor: { type: 'user', id: 'u', name: 'Asha', impersonatorId: 'sa', platform: false },
          target: null,
          meta: null,
          ip: null,
          at: '2026-10-08T00:00:00Z',
        },
        {
          id: 'e4',
          action: 'auth.login',
          actor: { type: 'system', id: null, name: null, impersonatorId: null, platform: false },
          target: null,
          meta: null,
          ip: null,
          at: '2026-10-08T00:00:00Z',
        },
      ],
      meta: { hasMore: false, nextCursor: null },
    });
    renderWithProviders({ route: '/settings/audit' });
    expect(await screen.findByText('API key')).toBeInTheDocument();
    expect(screen.getByText('Platform admin')).toBeInTheDocument();
    expect(screen.getByText('Asha (via support)')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('reason: x · fields: a, b')).toBeInTheDocument();
    await userEvent.click(screen.getByLabelText('Show'));
    await userEvent.click(screen.getByRole('option', { name: 'Team' }));
    await waitFor(() =>
      expect(auditApi.list).toHaveBeenLastCalledWith({ action: 'team.*', limit: 50 }),
    );
  });
});
