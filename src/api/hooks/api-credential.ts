import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapApiCredential } from '../mappers/api-credential';
import { apiQuery } from '../query';

export function useApiCredentialsQuery(type?: 'user' | 'organization') {
  return useQuery({
    ...apiQuery('get /v1/credentials', {
      query: {
        limit: '100',
        type: type !== undefined ? upperCase(type) : undefined,
      },
    }),
    select: ({ credentials }) => credentials!.map(mapApiCredential),
  });
}
