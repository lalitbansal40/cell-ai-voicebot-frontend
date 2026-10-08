import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import { SnackbarProvider } from 'notistack';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';

import { routes as appRoutes } from '@/app/routes';
import { theme } from '@/theme';

interface RenderOptions {
  /** Initial URL, e.g. "/" or "/does-not-exist". */
  route?: string;
  /** Routes to mount; defaults to the real app routes. */
  routes?: RouteObject[];
  /** Custom query client (defaults to one without retries). */
  queryClient?: QueryClient;
}

/** Render the app (or given routes) with the same providers as production, minus devtools. */
export function renderWithProviders({
  route = '/',
  routes = appRoutes,
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }),
}: RenderOptions = {}): RenderResult {
  const router = createMemoryRouter(routes, { initialEntries: [route] });

  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={3}>
          <RouterProvider router={router} />
        </SnackbarProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
