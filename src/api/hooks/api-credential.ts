import { apiQuery } from 'src/api/api';

import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';
import { mapApiCredential } from '../mappers/api-credential';

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
