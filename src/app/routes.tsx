import { Navigate, Outlet, type RouteObject } from 'react-router';

import { AuthBootstrap } from '@/features/auth/AuthBootstrap';
import {
  RedirectIfAuthed,
  RequireAuth,
  RequirePermission,
  RequirePlatformAdmin,
} from '@/features/auth/guards';
import { AppLayout } from '@/layout/AppLayout';
import { AdminAccountDetailPage } from '@/pages/admin/AdminAccountDetailPage';
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage';
import { AcceptInvitePage } from '@/pages/auth/AcceptInvitePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { ActivityPage } from '@/pages/contacts/ActivityPage';
import { ContactDetailPage } from '@/pages/contacts/ContactDetailPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { ImportWizardPage } from '@/pages/contacts/ImportWizardPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TeamPage } from '@/pages/TeamPage';

/** DEV-only tools — the dynamic import is dropped from production builds. */
const devRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/dev/realtime',
        lazy: async () => ({
          Component: (await import('@/pages/dev/RealtimeDevPage')).RealtimeDevPage,
        }),
      },
    ]
  : [];

export const routes: RouteObject[] = [
  {
    element: (
      <AuthBootstrap>
        <Outlet />
      </AuthBootstrap>
    ),
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/login',
        element: (
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: '/signup',
        element: (
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: '/verify-email',
        element: (
          <RedirectIfAuthed>
            <VerifyEmailPage />
          </RedirectIfAuthed>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <RedirectIfAuthed>
            <ForgotPasswordPage />
          </RedirectIfAuthed>
        ),
      },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/accept-invite', element: <AcceptInvitePage /> },
      {
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/403', element: <ForbiddenPage /> },
          {
            path: '/team',
            element: (
              <RequirePermission perm="team.read">
                <TeamPage />
              </RequirePermission>
            ),
          },
          {
            path: '/contacts',
            element: (
              <RequirePermission perm="contacts.read">
                <Outlet />
              </RequirePermission>
            ),
            children: [
              { index: true, element: <Navigate to="/contacts/all" replace /> },
              { path: 'c/:id', element: <ContactDetailPage /> },
              { path: 'activity', element: <ActivityPage /> },
              {
                path: 'import',
                element: (
                  <RequirePermission perm="contacts.import">
                    <ImportWizardPage />
                  </RequirePermission>
                ),
              },
              {
                path: 'import/:jobId',
                element: (
                  <RequirePermission perm="contacts.import">
                    <ImportWizardPage />
                  </RequirePermission>
                ),
              },
              { path: ':tab', element: <ContactsPage /> },
            ],
          },
          { path: '/settings', element: <Navigate to="/settings/profile" replace /> },
          { path: '/settings/:tab', element: <SettingsPage /> },
          {
            path: '/admin',
            element: (
              <RequirePlatformAdmin>
                <Outlet />
              </RequirePlatformAdmin>
            ),
            children: [
              { index: true, element: <Navigate to="/admin/accounts" replace /> },
              { path: 'accounts', element: <AdminAccountsPage /> },
              { path: 'accounts/:id', element: <AdminAccountDetailPage /> },
            ],
          },
        ],
      },
      ...devRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
