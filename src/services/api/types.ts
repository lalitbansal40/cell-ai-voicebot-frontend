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

/** Auth + account (Phase 2). */
export type AuthSession = Schemas['AuthSession'];
export type AuthMe = Schemas['AuthMe'];
export type PublicUser = Schemas['PublicUser'];
export type PublicAccount = Schemas['PublicAccount'];
export type Session = Schemas['Session'];
export type WsTicket = Schemas['WsTicket'];
export type RbacCatalog = Schemas['RbacCatalog'];
export type TeamMember = Schemas['TeamMember'];
export type InviteInfo = Schemas['InviteInfo'];
export type ApiKey = Schemas['ApiKey'];
export type CreatedApiKey = Schemas['CreatedApiKey'];
export type AuditEntry = Schemas['AuditEntry'];
export type AdminAccountRow = Schemas['AdminAccountRow'];
export type AdminAccountDetail = Schemas['AdminAccountDetail'];

/** Success envelope with list meta. */
export interface ListEnvelope<T, M> {
  success: true;
  data: T[];
  meta: M;
}
