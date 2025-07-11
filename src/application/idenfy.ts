import { useQuery } from '@tanstack/react-query';

import { useUserUnsafe } from 'src/api/hooks/session';
import { useApiQueryFn } from 'src/api/use-api';

export function useIdenfyLink() {
  const user = useUserUnsafe();

  const query = useQuery({
    ...useApiQueryFn('getIdenfyToken'),
    select: (result) => result.auth_token!,
    enabled: user !== undefined,
    meta: { showError: false },
    refetchOnMount: false,
    refetchInterval: false,
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
