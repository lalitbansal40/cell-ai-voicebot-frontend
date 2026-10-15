import { apiClient, unwrap } from './client';
import type {
  Call,
  CallEvent,
  CallRecordingLink,
  CallStatusValue,
  CallTranscriptTurn,
  CursorPageMeta,
  ListEnvelope,
  StartedWebCall,
  SuccessEnvelope,
} from './types';

export interface StartWebCallInput {
  flowId?: string;
  version?: 'draft' | 'published' | number;
  agentId?: string;
  contactId?: string;
  variables?: Record<string, string>;
  testPhone?: string;
}

export interface ListCallsQuery {
  cursor?: string;
  limit?: number;
  status?: CallStatusValue[];
  flowId?: string;
  agentId?: string;
  contactId?: string;
  isTest?: boolean;
  from?: string;
  to?: string;
  q?: string;
}

const listParams = ({ status, isTest, ...rest }: ListCallsQuery) => ({
  ...rest,
  ...(status?.length ? { status: status.join(',') } : {}),
  ...(isTest === undefined ? {} : { isTest: String(isTest) }),
});

/** `/api/v1/calls` — browser test calls, history, transcripts, recordings. */
export const callsApi = {
  /** Creates the call + wallet hold; join `/ws/media` with the ticket within 60 s. */
  startWeb: (body: StartWebCallInput) =>
    unwrap(apiClient.post<SuccessEnvelope<StartedWebCall>>('/calls/web', body)),
  list: async (query: ListCallsQuery) =>
    (
      await apiClient.get<ListEnvelope<Call, CursorPageMeta>>('/calls', {
        params: listParams(query),
      })
    ).data,
  active: () => unwrap(apiClient.get<SuccessEnvelope<Call[]>>('/calls/active')),
  get: (id: string) => unwrap(apiClient.get<SuccessEnvelope<Call>>(`/calls/${id}`)),
  transcript: (id: string) =>
    unwrap(apiClient.get<SuccessEnvelope<CallTranscriptTurn[]>>(`/calls/${id}/transcript`)),
  events: (id: string) =>
    unwrap(apiClient.get<SuccessEnvelope<CallEvent[]>>(`/calls/${id}/events`)),
  /** Signed 5-minute link (calls.listen; audited on the server). */
  recording: (id: string) =>
    unwrap(apiClient.get<SuccessEnvelope<CallRecordingLink>>(`/calls/${id}/recording`)),
  hangup: (id: string) => unwrap(apiClient.post<SuccessEnvelope<Call>>(`/calls/${id}/hangup`)),
};
