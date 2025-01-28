import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { fromApi } from '../from-api';
import { ApiCredential } from '../model';
import { useApiQueryFn } from '../use-api';

export function useApiCredentialsQuery(type?: 'user' | 'organization') {
  return useQuery({
    ...useApiQueryFn('listApiCredentials', {
      query: {
        limit: '100',
        type: type !== undefined ? upperCase(type) : undefined,
      },
    }),
    select: ({ credentials }): ApiCredential[] => fromApi(credentials!),
  });
}
