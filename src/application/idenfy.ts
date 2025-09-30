import { useQuery } from '@tanstack/react-query';

import { apiQuery } from 'src/api/api';

export function useIdenfyLink() {
  const query = useQuery({
    ...apiQuery('get /v1/account/idenfy', {}),
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
