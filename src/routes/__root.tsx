import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import z from 'zod';

import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  queryClient: QueryClient;
  translate: TranslateFn;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),
});
