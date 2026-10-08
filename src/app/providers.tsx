import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { enqueueSnackbar, SnackbarProvider } from 'notistack';
import { useState, type ReactNode } from 'react';

import { RealtimeProvider } from '@/services/realtime';
import { theme } from '@/theme';

import { createQueryClient } from './query-client';

interface ProvidersProps {
  children: ReactNode;
}

const notify = (message: string, variant: 'error') => {
  enqueueSnackbar(message, { variant });
};

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient({ notify }));

  return (
    <ThemeProvider theme={theme} defaultMode="light">
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <SnackbarProvider maxSnack={3} autoHideDuration={4000} preventDuplicate>
          {/* Phase 2: ticket provider (POST /api/v1/ws/tickets) turns realtime on. */}
          <RealtimeProvider getTicket={null}>{children}</RealtimeProvider>
        </SnackbarProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
