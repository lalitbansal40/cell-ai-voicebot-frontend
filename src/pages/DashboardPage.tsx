import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import { PageHeader } from '@/components/PageHeader';
import { useSession } from '@/features/auth/hooks';
import { SystemInfoCard } from '@/features/system/SystemInfoCard';

const UPCOMING = [
  { title: 'Calls', text: 'Live call status and results — Phase 7.' },
  { title: 'Wallet', text: 'Balance, top-ups and spend — Phase 4.' },
  { title: 'Campaigns', text: 'Running campaigns and progress — Phase 8.' },
];

export function DashboardPage() {
  const session = useSession();
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome, ${session?.user.name ?? ''}`} />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Account
              </Typography>
              <Typography variant="h6">{session?.account.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Your role: {session?.role.name} · Timezone: {session?.account.timezone}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SystemInfoCard />
        </Grid>
        {UPCOMING.map((card) => (
          <Grid key={card.title} size={{ xs: 12, md: 4 }}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle1">{card.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {card.text}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
