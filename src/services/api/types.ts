import type { components } from './schema.gen';

type Schemas = components['schemas'];

/** Backend app info (`GET /api/v1/system/info`). */
export type AppInfo = Schemas['AppInfo'];

/** Error envelope returned by every failed request (docs/conventions/api.md §4). */
export type ApiErrorEnvelope = Schemas['ErrorEnvelope'];

/** Pagination meta shapes (api.md §6). */
export type OffsetPageMeta = Schemas['OffsetPageMeta'];
export type CursorPageMeta = Schemas['CursorPageMeta'];

/** Success envelope around a single resource (api.md §3). */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}
