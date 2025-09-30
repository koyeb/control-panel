import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapDomain } from '../mappers/domain';
import { apiQuery } from '../query';

export function useDomainsQuery(type?: 'autoassigned' | 'custom') {
  return useQuery({
    ...apiQuery('get /v1/domains', {
      query: {
        limit: '100',
        types: type ? [upperCase(type)] : undefined,
      },
    }),
    select: ({ domains }) => domains!.map(mapDomain),
  });
}
