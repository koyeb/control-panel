import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { CreateVolumePage } from 'src/pages/volumes/create-volume/create-volume.page';

export const Route = createFileRoute('/_main/volumes/new')({
  component: CreateVolumePage,

  validateSearch: z.object({
    snapshot: z.string().optional(),
  }),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
