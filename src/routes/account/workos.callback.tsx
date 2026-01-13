import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

export const Route = createFileRoute('/account/workos/callback')({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
  }),
});
