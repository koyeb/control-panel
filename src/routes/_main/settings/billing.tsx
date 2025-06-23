import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { BillingPage } from 'src/pages/settings/organization/billing/billing.page';

export const Route = createFileRoute('/_main/settings/billing')({
  component: BillingPage,

  beforeLoad: ({ location }) => {
    return {
      breadcrumb: getBreadcrumb(location, 'organizationSettings.billing'),
    };
  },
});
