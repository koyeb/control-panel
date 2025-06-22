import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { PlansPage } from 'src/pages/settings/organization/plans/plans.page';

export const Route = createFileRoute('/_main/settings/plans')({
  component: PlansPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'organizationSettings.plans');
  },
});
