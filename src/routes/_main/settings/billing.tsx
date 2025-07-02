import { createFileRoute } from '@tanstack/react-router';

import { BillingPage } from 'src/pages/settings/organization/billing/billing.page';

export const Route = createFileRoute('/_main/settings/billing')({
  component: BillingPage,
});
