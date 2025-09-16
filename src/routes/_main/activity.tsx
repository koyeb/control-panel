import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { ActivityPage } from 'src/pages/activity/activity.page';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,

  validateSearch: z.object({
    types: z.array(z.string()).optional(),
  }),
});
