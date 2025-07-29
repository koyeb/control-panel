import { useQuery } from '@tanstack/react-query';

import { isAccountLockedError } from 'src/api/api-errors';
import { useOrganizationQuery, useUserQuery } from 'src/api/hooks/session';
import { useApiQueryFn } from 'src/api/use-api';

export function useIdenfyLink() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  const locked = [
    isAccountLockedError(userQuery.error),
    isAccountLockedError(organizationQuery.error),
    organizationQuery.data?.statusMessage === 'VERIFICATION_FAILED',
  ].some(Boolean);

  const query = useQuery({
    ...useApiQueryFn('getIdenfyToken'),
    select: (result) => result.auth_token!,
    enabled: !locked,
    meta: { showError: false },
    refetchOnMount: false,
    refetchInterval: false,
  });

  if (query.isSuccess) {
    return `https://ivs.idenfy.com/api/v2/redirect?authToken=${query.data}`;
  }
}
