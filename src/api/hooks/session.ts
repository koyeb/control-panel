import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { useAuthKit } from 'src/application/authkit';
import { useIdentifyUser } from 'src/application/posthog';
import { setAuthKitToken, setToken } from 'src/application/token';
import { useNavigate } from 'src/hooks/router';

import { ApiError } from '../api-error';
import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';
import { apiMutation, apiQuery } from '../query';

export function useUserQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/profile', {}),
    select: (result) => mapUser(result.user!),
  });
}

export function useUser() {
  return useUserQuery().data;
}

export function useOrganizationQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/organization', {}),
    select: (result) => mapOrganization(result.organization!),
  });
}

export function useOrganization() {
  return useOrganizationQuery().data;
}

export function useSwitchOrganization(onSuccess?: () => void) {
  const authKit = useAuthKit();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => authKit.switchOrganization(organizationId),
    async onSuccess() {
      queryClient.clear();
      onSuccess?.();
    },
  });
}

export function useOrganizationSummaryQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...apiQuery('get /v1/organizations/{organization_id}/summary', {
      path: { organization_id: organization?.id as string },
    }),
    select: ({ summary }) => mapOrganizationSummary(summary!),
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...apiQuery('get /v1/organizations/{organization_id}/quotas', {
      path: { organization_id: organization?.id as string },
    }),
    refetchInterval: false,
    select: ({ quotas }) => mapOrganizationQuotas(quotas!),
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}

export function useLogoutMutation() {
  const authKit = useAuthKit();
  const userQuery = useUserQuery();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const apiLogout = useMutation({
    ...apiMutation('delete /v1/account/logout', {}),
    meta: { showError: !ApiError.isAccountLockedError(userQuery.error) },
    async onSettled() {
      clearIdentify();
      setToken(null);
      await navigate({ to: '/auth/signin' });
    },
  });

  const authKitLogout = useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => authKit.signOut(),
    onSuccess: async () => {
      clearIdentify();
      setAuthKitToken(null);
      await navigate({ to: '/auth/signin' });
    },
  });

  return authKit.user ? authKitLogout : apiLogout;
}
