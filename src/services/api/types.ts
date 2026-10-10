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

/** Contacts (Phase 3). */
export type Contact = Schemas['Contact'];
export type ContactList = Schemas['ContactList'];
export type ContactFilter = Schemas['ContactFilter'];
export type ContactFilterCondition = Schemas['ContactFilterCondition'];
export type CustomField = Schemas['CustomField'];
export type FieldType = Schemas['FieldType'];
export type Segment = Schemas['Segment'];
export type SegmentPreview = Schemas['SegmentPreview'];
export type DndEntry = Schemas['DndEntry'];
export type ImportColumnMapping = Schemas['ImportColumnMapping'];
export type ImportOptions = Schemas['ImportOptions'];
/** The generator renders the nullable `options` ref as `ImportOptions & (… | null)`; it is `null` until set. */
export type ImportJob = Omit<Schemas['ImportJob'], 'options'> & { options: ImportOptions | null };
export type ExportJob = Schemas['ExportJob'];

/** Success envelope with list meta. */
export interface ListEnvelope<T, M> {
  success: true;
  data: T[];
  meta: M;
}

/** Wallet, billing & payments (Phase 4). */
export type Wallet = Schemas['Wallet'];
export type WalletStatus = Wallet['status'];
export type RateCardView = Schemas['RateCardView'];
export type WalletEstimate = Schemas['WalletEstimate'];
export type LedgerEntry = Schemas['LedgerEntry'];
export type UsageSeries = Schemas['UsageSeries'];
export type BillingProfile = Schemas['BillingProfile'];
/** The generator renders the nullable `profile` ref as `BillingProfile & (… | null)`; it is `null` until saved. */
export type BillingProfileResponse = Omit<Schemas['BillingProfileResponse'], 'profile'> & {
  profile: BillingProfile | null;
};
export type GstState = Schemas['GstState'];
export type Invoice = Schemas['Invoice'];
export type TopupOrder = Schemas['TopupOrder'];
export type TopupCheckout = Schemas['TopupCheckout'];
export type Notification = Schemas['Notification'];
export type RateCardVersion = Schemas['RateCardVersion'];
export type AccountRateCards = Schemas['AccountRateCards'];
export type WalletAdjustment = Schemas['WalletAdjustment'];
export type SimulatedHold = Schemas['SimulatedHold'];
export type SimulatedCallResult = Schemas['SimulatedCallResult'];
export type BillingSummary = Schemas['BillingSummary'];
export type AdminPayment = Schemas['AdminPayment'];
export type PaymentEvent = Schemas['PaymentEvent'];
export type AdminBillingConfig = Schemas['AdminBillingConfig'];

/** AI agents, knowledge & playground (Phase 5). */
export type Agent = Schemas['Agent'];
export type AgentRow = Schemas['AgentRow'];
export type AgentFunction = Schemas['AgentFunction'];
export type AgentFunctionParam = AgentFunction['parameters'][number];
export type AgentFunctionHeader = AgentFunction['headers'][number];
export type AgentFunctionTestResult = Schemas['AgentFunctionTestResult'];
export type AgentTemplate = Schemas['AgentTemplate'];
export type AgentCatalog = Schemas['AgentCatalog'];
export type AgentVariable = AgentCatalog['variables'][number];
export type AgentUsage = Schemas['AgentUsage'];
export type CompilePreview = Schemas['AgentCompilePreview'];
export type AgentVoice = Agent['voice'];
export type AgentLanguage = Agent['language'];
export type ToneRule = Agent['toneRules'][number];
export type BuiltInTools = Agent['builtInTools'];
export type Disposition = AgentCatalog['dispositions'][number];
export type KnowledgeBase = Schemas['KnowledgeBase'];
export type KnowledgeSource = Schemas['KnowledgeSource'];
export type KnowledgeSearchResult = Schemas['KnowledgeHit'];
export type PlaygroundSession = Schemas['PlaygroundSession'];
export type PlaygroundSessionRow = Schemas['PlaygroundSessionRow'];
export type PlaygroundTurn = Schemas['PlaygroundTurn'];
export type PlaygroundToolCall = PlaygroundTurn['toolCalls'][number];
export type PlaygroundOutcome = PlaygroundSession['outcome'];
export type PlaygroundReply = Schemas['PlaygroundReply'];
export type AdminAiConfig = Schemas['AdminAiConfig'];
