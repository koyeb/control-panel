import { createFileRoute } from '@tanstack/react-router';
import z from 'zod';

import { SignUpPage } from 'src/pages/authentication/sign-up.page';

export const Route = createFileRoute('/auth/signup')({
  component: SignUpPage,

  validateSearch: z.object({
    method: z.literal('email').optional(),
  }),
});
