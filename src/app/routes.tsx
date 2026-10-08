import type { RouteObject } from 'react-router';

import { HomePage } from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

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
  { path: '/', element: <HomePage /> },
  ...devRoutes,
  { path: '*', element: <NotFoundPage /> },
];
