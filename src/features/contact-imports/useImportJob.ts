import { useQuery, useQueryClient } from '@tanstack/react-query';

import { contactKeys, importKeys } from '@/features/contacts/keys';
import { contactImportsApi } from '@/services/api/contact-imports';
import type { ImportJob } from '@/services/api/types';
import { useWsEvent, useWsStatus } from '@/services/realtime';

const RUNNING = ['validating', 'importing'];
export const POLL_MS = 3000;

/** One import job, live: WS `import.progress` when connected, polling every 3 s otherwise. */
export const useImportJob = (id: string | undefined) => {
  const queryClient = useQueryClient();
  const ws = useWsStatus();
  const query = useQuery({
    queryKey: importKeys.detail(id ?? ''),
    queryFn: () => contactImportsApi.get(id ?? ''),
    enabled: Boolean(id),
    meta: { silent: true },
    refetchInterval: (q) =>
      RUNNING.includes(q.state.data?.status ?? '') && ws !== 'open' ? POLL_MS : false,
  });
  useWsEvent('import.progress', (event) => {
    if (!id || event.data.importJobId !== id) return;
    const current = queryClient.getQueryData<ImportJob>(importKeys.detail(id));
    if (current && current.status === event.data.status) {
      queryClient.setQueryData(importKeys.detail(id), {
        ...current,
        progress: { processed: event.data.processed, total: event.data.total },
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: importKeys.detail(id) });
    if (event.data.status === 'completed')
      void queryClient.invalidateQueries({ queryKey: contactKeys.all });
  });
  return query;
};
