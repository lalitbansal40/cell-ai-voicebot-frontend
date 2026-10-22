import { PageHeader } from '@/components/PageHeader';
import { useInboxLiveUpdates } from '@/features/inbox/queries';

/** `/inbox`, `/inbox/:conversationId` — WhatsApp conversations (lazy chunk). */
export function InboxPage() {
  useInboxLiveUpdates();
  return <PageHeader title="Inbox" subtitle="WhatsApp conversations with your customers." />;
}
