import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/features/auth/store';
import { adminApi } from '@/services/api/admin';
import { ApiError } from '@/services/api/errors';
import type { AdminAccountDetail, AdminAccountRow } from '@/services/api/types';
import { fakeSession, signInAs } from '@/test/auth';
import { renderWithProviders } from '@/test/render';

vi.mock('@/services/api/admin', () => ({
  adminApi: {
    accounts: vi.fn(),
    account: vi.fn(),
    suspend: vi.fn(),
    enable: vi.fn(),
    impersonate: vi.fn(),
    stopImpersonation: vi.fn(),
  },
}));
vi.mock('@/services/api/auth', () => ({
  authApi: { refresh: vi.fn(() => Promise.reject(new Error('x'))), me: vi.fn() },
}));

const api = vi.mocked(adminApi);
afterEach(() => vi.clearAllMocks());

const ROW: AdminAccountRow = {
  id: 'acc1',
  name: 'Demo Finance',
  slug: 'demo-finance',
  status: 'active',
  ownerEmail: 'asha@example.com',
  usersCount: 3,
  createdAt: '2026-10-01T00:00:00Z',
};

const base = fakeSession('owner');
const detail = (overrides: Partial<AdminAccountDetail['account']> = {}): AdminAccountDetail => ({
  account: { ...base.account, id: 'acc1', ...overrides },
  owner: base.user as AdminAccountDetail['owner'],
  usersCount: 3,
  usersByStatus: { active: 2, invited: 1, disabled: 0 },
  recentAudit: [
    {
      id: 'e1',
      action: 'team.invited',
      actor: { type: 'user', id: 'u1', name: 'Asha', impersonatorId: null, platform: false },
      target: null,
      meta: { email: 'new@example.com' },
      ip: null,
      at: '2026-10-08T00:00:00Z',
    },
  ],
});

describe('Admin accounts list', () => {
  it('is only for platform admins', async () => {
    signInAs('owner');
    renderWithProviders({ route: '/admin/accounts' });
    expect(await screen.findByRole('heading', { level: 1, name: '403' })).toBeInTheDocument();
    expect(api.accounts).not.toHaveBeenCalled();
  });

  it('sends an impersonating admin to the customer dashboard', async () => {
    signInAs('superadmin', {
      impersonation: { impersonatorId: 'sa', expiresAt: '2026-10-08T00:30:00Z' },
    });
    renderWithProviders({ route: '/admin/accounts' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(api.accounts).not.toHaveBeenCalled();
  });

  it('lists accounts, searches (debounced) and filters by status', async () => {
    signInAs('superadmin');
    api.accounts.mockResolvedValue({
      success: true,
      data: [ROW],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders({ route: '/admin' });
    expect(await screen.findByRole('link', { name: 'Demo Finance' })).toHaveAttribute(
      'href',
      '/admin/accounts/acc1',
    );
    expect(screen.getByText('asha@example.com')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Search name, slug or owner email'), ' demo ');
    await waitFor(() =>
      expect(api.accounts).toHaveBeenLastCalledWith({ page: 1, limit: 20, search: 'demo' }),
    );
    await userEvent.click(screen.getByLabelText('Status'));
    await userEvent.click(screen.getByRole('option', { name: 'Suspended' }));
    await waitFor(() =>
      expect(api.accounts).toHaveBeenLastCalledWith({
        page: 1,
        limit: 20,
        status: 'suspended',
        search: 'demo',
      }),
    );
    await userEvent.click(screen.getByRole('combobox', { name: /rows per page/i }));
    await userEvent.click(screen.getByRole('option', { name: '50' }));
    await waitFor(() =>
      expect(api.accounts).toHaveBeenLastCalledWith(expect.objectContaining({ limit: 50 })),
    );
  });

  it('shows an empty state and errors', async () => {
    signInAs('superadmin');
    api.accounts.mockRejectedValueOnce(
      new ApiError({ status: 500, code: 'INTERNAL_ERROR', kind: 'http', message: 'Boom' }),
    );
    api.accounts.mockResolvedValue({
      success: true,
      data: [{ ...ROW, ownerEmail: null }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    renderWithProviders({ route: '/admin/accounts' });
    expect(await screen.findByText('Boom')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('—')).toBeInTheDocument();
  });
});

describe('Admin account detail', () => {
  it('shows the overview, recent activity and the rates placeholder', async () => {
    signInAs('superadmin');
    api.account.mockResolvedValue(detail());
    renderWithProviders({ route: '/admin/accounts/acc1' });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Demo Finance' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Asha Verma · asha@example.com')).toBeInTheDocument();
    expect(screen.getByText('3 total · 2 active · 1 invited · 0 disabled')).toBeInTheDocument();
    expect(screen.getByText('Hinglish')).toBeInTheDocument();
    expect(screen.getByText('email: new@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Rates' }));
    expect(screen.getByText('Per-account rates arrive in Phase 4')).toBeInTheDocument();
    expect(api.account).toHaveBeenCalledWith('acc1');
  });

  it('suspends with a reason', async () => {
    signInAs('superadmin');
    api.account.mockResolvedValue(detail());
    api.suspend
      .mockRejectedValueOnce(
        new ApiError({
          status: 409,
          code: 'CONFLICT_INVALID_STATE',
          kind: 'http',
          message: 'The account is already suspended.',
        }),
      )
      .mockResolvedValueOnce({ ...base.account, status: 'suspended' });
    renderWithProviders({ route: '/admin/accounts/acc1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
    const dialog = screen.getByRole('dialog', { name: 'Suspend Demo Finance?' });
    const submit = within(dialog).getByRole('button', { name: 'Suspend account' });
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'no');
    expect(submit).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Reason'), 't paid');
    expect(within(dialog).getByText('8/200')).toBeInTheDocument();
    await userEvent.click(submit);
    expect(
      await within(dialog).findByText('The account is already suspended.'),
    ).toBeInTheDocument();
    await userEvent.click(submit);
    await waitFor(() => expect(api.suspend).toHaveBeenLastCalledWith('acc1', 'not paid'));
    expect(await screen.findByText('Demo Finance suspended')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels suspending', async () => {
    signInAs('superadmin');
    api.account.mockResolvedValue(detail());
    renderWithProviders({ route: '/admin/accounts/acc1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(api.suspend).not.toHaveBeenCalled();
  });

  it('enables a suspended account after confirming', async () => {
    signInAs('superadmin');
    api.account.mockResolvedValue(detail({ status: 'suspended', suspendReason: 'Unpaid' }));
    api.enable.mockResolvedValue({ ...base.account, status: 'active' });
    renderWithProviders({ route: '/admin/accounts/acc1' });
    expect(await screen.findByText('Suspended: Unpaid')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Enable' }));
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Enable Demo Finance?' })).getByRole('button', {
        name: 'Enable',
      }),
    );
    await waitFor(() => expect(api.enable).toHaveBeenCalledWith('acc1'));
    expect(await screen.findByText('Demo Finance enabled')).toBeInTheDocument();
  });

  it('impersonates the owner after confirming and keeps the admin session', async () => {
    const admin = signInAs('superadmin');
    api.account.mockResolvedValue(detail());
    api.impersonate.mockResolvedValue(
      fakeSession('owner', {
        expiresIn: 1800,
        impersonation: { impersonatorId: admin.user.id, expiresAt: '2026-10-08T00:30:00Z' },
      }),
    );
    renderWithProviders({ route: '/admin/accounts/acc1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Impersonate' }));
    const dialog = screen.getByRole('dialog', { name: 'View as the owner of Demo Finance?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Start viewing' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    const state = useAuthStore.getState();
    expect(state.session?.impersonation?.impersonatorId).toBe(admin.user.id);
    expect(state.savedSession?.user.platformRole).toBe('superadmin');
  });

  it('does nothing when impersonation is cancelled; shows impersonation errors', async () => {
    signInAs('superadmin');
    api.account.mockResolvedValue(detail());
    api.impersonate.mockRejectedValue(
      new ApiError({
        status: 409,
        code: 'CONFLICT_INVALID_STATE',
        kind: 'http',
        message: 'This account has no active owner to view as.',
      }),
    );
    renderWithProviders({ route: '/admin/accounts/acc1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Impersonate' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }),
    );
    expect(api.impersonate).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Impersonate' }));
    await userEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Start viewing' }),
    );
    expect(
      await screen.findAllByText('This account has no active owner to view as.'),
    ).not.toHaveLength(0);
  });

  it('disables impersonation without an owner and shows load errors', async () => {
    signInAs('superadmin');
    api.account
      .mockRejectedValueOnce(
        new ApiError({ status: 404, code: 'NOT_FOUND', kind: 'http', message: 'Not found.' }),
      )
      .mockResolvedValue({ ...detail(), owner: null as unknown as AdminAccountDetail['owner'] });
    renderWithProviders({ route: '/admin/accounts/acc1' });
    expect(await screen.findByText('Not found.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('button', { name: 'Impersonate' })).toBeDisabled();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
