import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { SystemInfoCard } from '@/features/system/SystemInfoCard';

export function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cell AI Voicebot
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Phase 1 — foundation ready
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {import.meta.env.VITE_APP_NAME ?? 'Cell AI Voicebot'}
      </Typography>
      <Box sx={{ mt: 4 }}>
        <SystemInfoCard />
      </Box>
    </Container>
  );
}
