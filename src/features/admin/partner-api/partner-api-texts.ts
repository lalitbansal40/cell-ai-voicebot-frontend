import type { PartnerEndpoint, PartnerNumber } from '@/services/api/partner-api';

/** PIN: the endpoint path with this number's ids filled in. */
export const filledPath = (
  e: PartnerEndpoint,
  n: Pick<PartnerNumber, 'phoneNumberId' | 'wabaId'>,
) =>
  e.path
    .replaceAll('{phoneNumberId}', n.phoneNumberId ?? '{phoneNumberId}')
    .replaceAll('{wabaId}', n.wabaId);

/** A ready curl for one endpoint — `$PINNACLE_KEY` unless a revealed key is given. */
export const curlFor = (
  e: PartnerEndpoint,
  n: Pick<PartnerNumber, 'phoneNumberId' | 'wabaId'>,
  urls: { baseUrl: string; voiceBaseUrl: string },
  key: string | null,
): string => {
  const url = `${e.host === 'voice' ? urls.voiceBaseUrl : urls.baseUrl}${filledPath(e, n)}`;
  const lines = [`curl -X ${e.method} '${url}'`, `  -H 'apikey: ${key ?? '$PINNACLE_KEY'}'`];
  if (e.body) {
    lines.push(`  -H 'Content-Type: application/json'`);
    lines.push(`  -d '${JSON.stringify(e.body)}'`);
  }
  return lines.join(' \\\n');
};

export const PARTNER_TEXTS = {
  notConfigured:
    'No partner API key configured for this account — add a managed number (Pinnacle) in Admin → account → WhatsApp.',
  superadminOnly:
    'Superadmin only. The customer never sees this. Calls you make here are not billed or logged by NotifyNow.',
  revealHelp:
    'Enter your own password (and two-step code) to show the key for 60 seconds. Every reveal is audited.',
  unsupported: 'Not carried by the partner',
};
