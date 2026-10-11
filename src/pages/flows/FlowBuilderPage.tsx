import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useParams, useSearchParams } from 'react-router';

import { FlowBuilder } from '@/features/flows/builder/FlowBuilder';
import {
  useCanPublishFlows,
  useCanWriteFlows,
  useFlow,
  useFlowCatalog,
  useFlowVersion,
} from '@/features/flows/queries';
import { useImpersonating } from '@/features/wallet/queries';
import { getErrorMessage } from '@/services/api/errors';
import type { DraftGraph } from '@/services/api/types';

/** `/flows/:id` (builder) and `/flows/:id?v=3` (a published version, read-only). Lazy-loaded. */
export function FlowBuilderPage() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const v = Number(params.get('v'));
  const versionNumber = Number.isInteger(v) && v > 0 ? v : null;
  const flow = useFlow(id);
  const catalog = useFlowCatalog();
  const version = useFlowVersion(id, versionNumber);
  const canWrite = useCanWriteFlows();
  const canPublish = useCanPublishFlows();
  const impersonating = useImpersonating();
  const small = useMediaQuery('(max-width:899.95px)');

  const error = flow.error ?? catalog.error ?? version.error;
  if (error) {
    return (
      <Alert severity="error" action={<Button onClick={() => void flow.refetch()}>Retry</Button>}>
        {getErrorMessage(error)}
      </Alert>
    );
  }
  if (!flow.data || !catalog.data || (versionNumber !== null && !version.data)) {
    return <Skeleton variant="rounded" height={480} aria-label="Loading the flow" />;
  }

  const reason = versionNumber
    ? `You are viewing published version v${String(versionNumber)}. Restore it from Versions to edit it.`
    : impersonating
      ? 'You are viewing as this account — flows cannot be changed while impersonating.'
      : !canWrite
        ? 'Read-only: you can view this flow but not change it.'
        : small
          ? 'The builder needs a wider screen to edit — this is a read-only view.'
          : undefined;

  return (
    <FlowBuilder
      key={`${flow.data.id}:${String(versionNumber ?? 'draft')}`}
      flow={flow.data}
      catalog={catalog.data}
      readOnly={Boolean(reason)}
      readOnlyReason={reason}
      canPublish={canPublish && !small}
      version={
        versionNumber && version.data
          ? { number: versionNumber, graph: version.data.graph as unknown as DraftGraph }
          : undefined
      }
    />
  );
}
