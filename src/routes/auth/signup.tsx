import { createFileRoute } from '@tanstack/react-router';

import { SignUpPage } from 'src/pages/authentication/sign-up.page';
import { z } from 'zod';

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,

  validateSearch: z.object({
    method: z.literal('email').optional(),
  }),
});
