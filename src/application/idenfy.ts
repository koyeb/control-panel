import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';

import { apiQuery } from 'src/api';

export function useIdenfyLink() {
  const { getAccessToken } = useAuth();

  const query = useQuery({
    ...apiQuery('get /v1/account/idenfy', {}),
    select: (result) => result.auth_token!,
    meta: { getAccessToken, showError: false },
    retry: true,
    refetchOnMount: false,
    refetchInterval: false,
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
