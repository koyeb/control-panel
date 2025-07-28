import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { ActivityPage } from 'src/pages/activity/activity.page';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,

  validateSearch: z.object({
    types: z.array(z.string()).optional(),
  }),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
