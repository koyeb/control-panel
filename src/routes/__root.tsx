import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';
import z from 'zod';

type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  validateSearch: z.object({
    token: z.string().optional(),
    'session-token': z.string().optional(),
  }),
});
