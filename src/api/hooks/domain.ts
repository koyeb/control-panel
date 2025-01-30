import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { fromApi } from '../from-api';
import { Domain } from '../model';
import { useApiQueryFn } from '../use-api';

export function useDomainsQuery(type?: 'autoassigned' | 'custom') {
  return useQuery({
    ...useApiQueryFn('listDomains', {
      query: {
        limit: '100',
        types: type ? [upperCase(type)] : undefined,
      },
    }),
    select: ({ domains }): Domain[] => fromApi(domains!),
  });
}
