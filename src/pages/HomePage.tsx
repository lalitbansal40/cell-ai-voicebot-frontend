import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export function HomePage() {
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cell AI Voicebot
      </Typography>
      <Typography variant="subtitle1" color="text.secondary">
        Phase 0 — setup ready
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        {import.meta.env.VITE_APP_NAME ?? 'Cell AI Voicebot'}
      </Typography>
    </Container>
  );
}
