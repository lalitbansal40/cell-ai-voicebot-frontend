import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';

import { useCanManageWhatsApp, useChannels, useWhatsAppConfig } from './queries';

const ATTENTION = new Set(['action_needed', 'needs_reconnect', 'restricted']);

/** Dashboard: "Connect WhatsApp" for managers without a number, else connected / attention counts. */
export function WhatsAppDashboardCard() {
  const config = useWhatsAppConfig();
  const channels = useChannels(Boolean(config.data?.enabled));
  const canManage = useCanManageWhatsApp();
  const items = channels.data?.items ?? [];
  // nothing to show: WhatsApp off on this server, still loading, or nothing a reader could do
  if (!config.data?.enabled || !channels.data || (items.length === 0 && !canManage)) return null;
  const connected = items.filter((c) => c.status === 'connected').length;
  const attention = items.filter((c) => ATTENTION.has(c.status)).length;
  return (
    <Card variant="outlined" sx={{ height: '100%' }} component="section" aria-label="WhatsApp">
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
        >
          <Typography variant="subtitle1">WhatsApp</Typography>
          <Link component={RouterLink} to="/whatsapp/numbers" variant="body2">
            Numbers
          </Link>
        </Stack>
        {items.length === 0 ? (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Connect your WhatsApp Business number to chat, send templates and call customers.
            </Typography>
            <div>
              <Button
                component={RouterLink}
                to="/whatsapp/numbers"
                variant="contained"
                size="small"
              >
                Connect WhatsApp
              </Button>
            </div>
          </Stack>
        ) : (
          <Typography variant="body2">
            {connected} connected
            {attention ? ` · ${String(attention)} need${attention === 1 ? 's' : ''} attention` : ''}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
