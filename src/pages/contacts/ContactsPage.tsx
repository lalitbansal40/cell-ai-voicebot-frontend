import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Link as RouterLink, Navigate, useNavigate, useParams } from 'react-router';

import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { useCan } from '@/features/auth/hooks';
import { ContactsTab } from '@/features/contacts/ContactsTab';
import {
  CONTACT_TAB_LABELS,
  CONTACT_TABS,
  isContactTab,
  type ContactTab,
} from '@/features/contacts/tabs';
import { useContactsLiveUpdates } from '@/features/contacts/useContactsLiveUpdates';

/** Tab bodies — filled in by the contacts feature (T3.14 / T3.17). */
function TabBody({ tab }: { tab: ContactTab }) {
  if (tab === 'all') return <ContactsTab />;
  return <EmptyState title={CONTACT_TAB_LABELS[tab]} />;
}

/** `/contacts/:tab` — contacts, lists, segments, do-not-call, fields. */
export function ContactsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const can = useCan();
  useContactsLiveUpdates();
  if (!isContactTab(tab)) return <Navigate to="/contacts/all" replace />;
  return (
    <>
      <PageHeader
        title="Contacts"
        subtitle="Your borrowers, their details and who not to call."
        actions={
          <>
            <Button component={RouterLink} to="/contacts/activity" variant="text">
              Imports & exports
            </Button>
            {can('contacts.import') && (
              <Button component={RouterLink} to="/contacts/import" variant="contained">
                Import contacts
              </Button>
            )}
          </>
        }
      />
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_e, v: ContactTab) => void navigate(`/contacts/${v}`)}
          variant="scrollable"
          allowScrollButtonsMobile
          aria-label="Contact sections"
        >
          {CONTACT_TABS.map((t) => (
            <Tab key={t} value={t} label={CONTACT_TAB_LABELS[t]} />
          ))}
        </Tabs>
      </Box>
      <TabBody tab={tab} />
    </>
  );
}
