import { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext } from '@tanstack/react-router';

import { TranslateFn } from 'src/intl/translate';

type RouterContext = {
  queryClient: QueryClient;
  translate: TranslateFn;
};

export const Route = createRootRouteWithContext<RouterContext>()({});
