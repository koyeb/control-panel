import { useQuery } from '@tanstack/react-query';

import { useApiQueryFn } from 'src/api/use-api';

export function useIdenfyLink() {
  const query = useQuery({
    ...useApiQueryFn('getIdenfyToken'),
    select: (result) => result.auth_token!,
    meta: { showError: false },
    retry: true,
    refetchOnMount: false,
    refetchInterval: false,
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
