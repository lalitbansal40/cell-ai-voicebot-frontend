import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';

/** `/admin/billing` — platform billing (filled in T4.14). */
export function AdminBillingPage() {
  return (
    <>
      <PageHeader title="Billing" />
      <EmptyState title="Coming next" />
    </>
  );
}
