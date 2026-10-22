import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { PageHeader } from '@/components/PageHeader';
import { NumbersPanel } from '@/features/whatsapp/numbers/NumbersPanel';

/** `/whatsapp/numbers` — WhatsApp numbers (Templates / Calling tabs come in later phases). */
export function WhatsAppPage() {
  return (
    <>
      <PageHeader title="WhatsApp" subtitle="Connect WhatsApp Business numbers to this account." />
      <Tabs value="numbers" sx={{ mb: 2 }} aria-label="WhatsApp sections">
        <Tab label="Numbers" value="numbers" />
      </Tabs>
      <NumbersPanel />
    </>
  );
}
