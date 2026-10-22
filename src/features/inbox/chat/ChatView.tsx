import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useState, type ReactNode } from 'react';

import { usePermission } from '@/features/auth/hooks';
import { ContactFormDialog } from '@/features/contacts/ContactFormDialog';
import { useCustomFields } from '@/features/contacts/queries';
import { getErrorMessage, toApiError } from '@/services/api/errors';
import type { InboxConversationDetail } from '@/services/api/types';

import { inboxErrorMessage } from '../labels';
import {
  useCanAssign,
  useCanReply,
  useConversation,
  useConversationTopic,
  useMarkRead,
  useRetryMessage,
} from '../queries';

import { ChatHeader } from './ChatHeader';
import type { SharedContact } from './MessageCards';
import { MessageList } from './MessageList';

export interface ChatSlots {
  /** Composer under the messages (T10.9). */
  composer?: (c: InboxConversationDetail) => ReactNode;
  assignee?: (c: InboxConversationDetail) => ReactNode;
  actions?: (c: InboxConversationDetail) => ReactNode;
}

/**
 * Middle pane (region "Chat with <name>"): live topic, read marker on open,
 * header, messages, typing indicator, composer slot, "Add contact" from cards.
 */
export function ChatView({
  conversationId,
  onBack,
  onShowDetails,
  slots = {},
}: {
  conversationId: string;
  onBack?: (() => void) | undefined;
  onShowDetails?: (() => void) | undefined;
  slots?: ChatSlots;
}) {
  const detail = useConversation(conversationId);
  const { typingName } = useConversationTopic(conversationId);
  useMarkRead(conversationId, detail.data?.unreadCount ?? 0);
  const canReply = useCanReply(detail.data?.channel ?? null);
  const canAssign = useCanAssign();
  const canAddContacts = usePermission('contacts.write');
  const retry = useRetryMessage(conversationId);
  const [card, setCard] = useState<SharedContact | null>(null);
  const fields = useCustomFields();

  if (detail.isPending) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress aria-label="Loading conversation" />
      </Box>
    );
  }
  if (detail.isError) {
    return (
      <Alert
        severity="error"
        sx={{ m: 2 }}
        action={
          <Button color="inherit" size="small" onClick={() => void detail.refetch()}>
            Retry
          </Button>
        }
      >
        {toApiError(detail.error).status === 404
          ? 'This conversation was not found.'
          : getErrorMessage(detail.error)}
      </Alert>
    );
  }
  const c = detail.data;
  return (
    <Box
      component="section"
      aria-label={`Chat with ${c.label}`}
      sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}
    >
      <ChatHeader
        conversation={c}
        onBack={onBack}
        onShowDetails={onShowDetails}
        assignee={slots.assignee?.(c)}
        actions={slots.actions?.(c)}
      />
      {retry.isError && (
        <Alert severity="error" onClose={() => retry.reset()} sx={{ borderRadius: 0 }}>
          {inboxErrorMessage(toApiError(retry.error))}
        </Alert>
      )}
      <MessageList
        key={c.id}
        conversation={c}
        canReply={canReply}
        canAssign={canAssign}
        onRetry={(m) => retry.mutate(m)}
        onAddContact={canAddContacts ? setCard : undefined}
      />
      {typingName && (
        <Typography variant="caption" color="text.secondary" sx={{ px: 2, py: 0.5 }} role="status">
          {typingName} is typing…
        </Typography>
      )}
      {slots.composer?.(c)}
      {card && (
        <ContactFormDialog
          open
          onClose={() => setCard(null)}
          fields={fields.data ?? []}
          initial={{
            phone: card.phones[0]?.phone,
            name: card.name,
            email: card.emails[0]?.email ?? '',
          }}
        />
      )}
    </Box>
  );
}
