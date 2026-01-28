import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { usePagination } from 'src/components/pagination';
import { SecretType } from 'src/model';

import { mapSecret } from '../mappers/secret';
import { apiQuery } from '../query';

export function useSecretsQuery(type?: SecretType) {
  const pagination = usePagination(100);

  const query = useQuery({
    ...apiQuery('get /v1/secrets', {
      query: {
        ...pagination.query,
        types: type !== undefined ? [type] : undefined,
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ secrets, count, limit, offset }) => ({
      secrets: secrets!.map(mapSecret),
      hasNext: count! > offset! + limit!,
    }),
  });

  pagination.useSync(query.data);

  return [query, pagination] as const;
}

export function useSecrets(type?: SecretType) {
  return useSecretsQuery(type)[0].data?.secrets;
}
