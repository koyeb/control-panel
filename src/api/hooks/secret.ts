import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { usePagination } from 'src/components/pagination';
import { SecretType } from 'src/model';

import { mapSecret } from '../mappers/secret';
import { apiQuery } from '../query';

type UseSecretsQueryOptions = {
  projectId?: string;
};

export function useSecretsQuery(type?: SecretType, options: UseSecretsQueryOptions = {}) {
  const pagination = usePagination(100);

  const query = useQuery({
    ...apiQuery('get /v1/secrets', {
      query: {
        ...pagination.query,
        project_id: options.projectId,
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

export function useSecrets(type?: SecretType, options?: UseSecretsQueryOptions) {
  return useSecretsQuery(type, options)[0].data?.secrets;
}
