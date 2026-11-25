/** Test calling API steps (backend `diagnose.service.ts`). */
export const DIAGNOSE_STEP_LABELS: Record<string, string> = {
  token: 'Meta access (token)',
  phone: 'Number (messaging limit, quality)',
  settings: 'Calling at WhatsApp',
  webhook: 'Call events to us (webhook)',
  send: 'Our app may place / answer calls',
  permission: 'Customer call permission',
};
