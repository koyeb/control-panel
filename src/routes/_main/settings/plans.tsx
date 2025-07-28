import { createFileRoute } from '@tanstack/react-router';

import { PlansPage } from 'src/pages/settings/organization/plans/plans.page';

export const Route = createFileRoute('/_main/settings/plans')({
  component: PlansPage,
});
