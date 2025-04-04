import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapSecret } from '../mappers/secret';
import { useApiQueryFn } from '../use-api';

export function useSecretsQuery(type?: 'simple' | 'registry') {
  return useQuery({
    ...useApiQueryFn('listSecrets', {
      query: {
        types: type !== undefined ? [upperCase(type)] : undefined,
        limit: '100',
      },
    }),
    select: ({ secrets }) => secrets!.map(mapSecret),
  });
}

export function useSecrets(type?: 'simple' | 'registry') {
  return useSecretsQuery(type).data;
}
