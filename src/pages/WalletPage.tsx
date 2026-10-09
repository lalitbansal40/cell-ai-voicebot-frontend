import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import type { ComponentType } from 'react';
import { useSearchParams } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { InvoicesTab } from '@/features/wallet/InvoicesTab';
import { OverviewTab } from '@/features/wallet/OverviewTab';
import { TransactionsTab } from '@/features/wallet/TransactionsTab';
import { UsageTab } from '@/features/wallet/UsageTab';

const TABS: { key: string; label: string; Component: ComponentType }[] = [
  { key: 'overview', label: 'Overview', Component: OverviewTab },
  { key: 'transactions', label: 'Transactions', Component: TransactionsTab },
  { key: 'usage', label: 'Usage', Component: UsageTab },
  { key: 'invoices', label: 'Invoices', Component: InvoicesTab },
];

/** `/wallet?tab=` — prepaid wallet (wallet.read). `?add=1` opens Add money. */
export function WalletPage() {
  const [params, setParams] = useSearchParams();
  const current = TABS.find((t) => t.key === params.get('tab')) ?? TABS[0];
  if (!current) return null;
  return (
    <>
      <PageHeader title="Wallet" subtitle="Prepaid balance for calls, AI and voice" />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={current.key}
          onChange={(_e, v: string) => setParams({ tab: v })}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Wallet sections"
        >
          {TABS.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>
      <current.Component />
    </>
  );
}
