import CloseOutlined from '@mui/icons-material/CloseOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { CopyButton } from '@/components/CopyButton';
import { formatPhone } from '@/utils/phone';

import { useContactPanel } from '../queries';

/** Right pane (region "Contact details"); the full panel arrives with T10.10. */
export function ContactPanel({
  conversationId,
  onClose,
}: {
  conversationId: string;
  /** Drawer mode: a close button. */
  onClose?: (() => void) | undefined;
}) {
  const panel = useContactPanel(conversationId);
  const contact = panel.data?.contact;
  return (
    <Box
      component="section"
      aria-label="Contact details"
      sx={{ p: 2, overflowY: 'auto', height: '100%' }}
    >
      <Stack direction="row" sx={{ alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Contact details
        </Typography>
        {onClose && (
          <IconButton aria-label="Close contact details" onClick={onClose} size="small">
            <CloseOutlined fontSize="small" />
          </IconButton>
        )}
      </Stack>
      {panel.isPending ? (
        <Skeleton variant="rounded" height={80} />
      ) : contact ? (
        <Stack spacing={0.5}>
          <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
            {contact.name ?? 'No name'}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2">{formatPhone(contact.phoneE164)}</Typography>
            <CopyButton value={contact.phoneE164} label="Copy number" />
          </Stack>
          {contact.whatsapp?.profileName && (
            <Typography variant="body2" color="text.secondary">
              WhatsApp name: {contact.whatsapp.profileName}
            </Typography>
          )}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          This contact was deleted. The chat is kept.
        </Typography>
      )}
    </Box>
  );
}
