import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapDomains } from '../mappers/domain';
import { useApiQueryFn } from '../use-api';

export function useDomainsQuery(type?: 'autoassigned' | 'custom') {
  return useQuery({
    ...useApiQueryFn('listDomains', {
      query: {
        limit: '100',
        types: type ? [upperCase(type)] : undefined,
      },
    }),
    select: mapDomains,
  });
}
