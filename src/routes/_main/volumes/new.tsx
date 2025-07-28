import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { CreateVolumePage } from 'src/pages/volumes/create-volume/create-volume.page';

export const Route = createFileRoute('/_main/volumes/new')({
  component: CreateVolumePage,

  validateSearch: z.object({
    snapshot: z.string().optional(),
  }),
});
