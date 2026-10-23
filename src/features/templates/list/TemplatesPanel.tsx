import { useTemplateLiveUpdates } from '../queries';

/** Templates tab of the WhatsApp page (region **Templates**). */
export function TemplatesPanel() {
  useTemplateLiveUpdates();
  return <section aria-label="Templates" />;
}
