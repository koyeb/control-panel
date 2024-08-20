import { useQuery } from '@tanstack/react-query';

import { upperCase } from 'src/utils/strings';

import { mapSecretsList } from '../mappers/secret';
import { useApiQueryFn } from '../use-api';

export function useSecretsQuery(type?: 'simple' | 'registry') {
  return useQuery({
    ...useApiQueryFn('listSecrets', {
      query: {
        types: type !== undefined ? [upperCase(type)] : undefined,
        limit: '100',
      },
    }),
    select: mapSecretsList,
  });
}

export function useSecrets(type?: 'simple' | 'registry') {
  return useSecretsQuery(type).data;
}
