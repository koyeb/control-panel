import { useQuery } from '@tanstack/react-query';

import { useUserUnsafe } from 'src/api/hooks/session';
import { useApiQueryFn } from 'src/api/use-api';
import { useFeatureFlag } from 'src/hooks/feature-flag';

export function useIdenfyLink() {
  const user = useUserUnsafe();
  const hasIdenfy = useFeatureFlag('idenfy');

  const query = useQuery({
    enabled: hasIdenfy && user !== undefined,
    meta: { showError: false },
    refetchOnMount: false,
    refetchInterval: false,
    ...useApiQueryFn('getIdenfyToken'),
    select: (result) => result.auth_token!,
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
