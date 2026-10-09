import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Navigate, useNavigate, useParams } from 'react-router';

import { PageHeader } from '@/components/PageHeader';
import { useCan } from '@/features/auth/hooks';
import { AccountTab } from '@/features/settings/AccountTab';
import { ApiKeysTab } from '@/features/settings/ApiKeysTab';
import { AuditTab } from '@/features/settings/AuditTab';
import { BillingTab } from '@/features/settings/BillingTab';
import { ProfileTab } from '@/features/settings/ProfileTab';
import { SecurityTab } from '@/features/settings/SecurityTab';
import { useHasWallet } from '@/features/wallet/queries';

const TABS = [
  { key: 'profile', label: 'Profile', Component: ProfileTab },
  { key: 'security', label: 'Security', Component: SecurityTab },
  { key: 'account', label: 'Account', Component: AccountTab, permission: 'account.read' },
  { key: 'billing', label: 'Billing details', Component: BillingTab, permission: 'wallet.read' },
  { key: 'api-keys', label: 'API keys', Component: ApiKeysTab, permission: 'apikeys.read' },
  { key: 'audit', label: 'Audit log', Component: AuditTab, permission: 'audit.read' },
];

export function SettingsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  const hasWallet = useHasWallet();
  const tabs = TABS.filter(
    (t) => (!t.permission || can(t.permission)) && (t.key !== 'billing' || hasWallet),
  );
  const current = tabs.find((t) => t.key === tab);
  if (!current)
    return <Navigate to={TABS.some((t) => t.key === tab) ? '/403' : '/settings/profile'} replace />;
  return (
    <>
      <PageHeader title="Settings" />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={current.key}
          onChange={(_e, v: string) => void navigate(`/settings/${v}`)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Settings sections"
        >
          {tabs.map((t) => (
            <Tab key={t.key} value={t.key} label={t.label} />
          ))}
        </Tabs>
      </Box>
      <current.Component />
    </>
  );
}
