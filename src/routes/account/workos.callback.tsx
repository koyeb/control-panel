import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { setCurrentProjectId } from 'src/api/hooks/project';

export const Route = createFileRoute('/account/workos/callback')({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),

  beforeLoad() {
    setCurrentProjectId(null);
  },
});
