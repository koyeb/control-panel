import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapApiCredential } from '../mappers/api-credential';
import { useApiQueryFn } from '../use-api';

export function useApiCredentialsQuery(type?: 'user' | 'organization') {
  return useQuery({
    ...useApiQueryFn('listApiCredentials', {
      query: {
        limit: '100',
        type: type !== undefined ? upperCase(type) : undefined,
      },
    }),
    select: ({ credentials }) => credentials!.map(mapApiCredential),
  });
}
