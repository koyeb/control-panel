import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { useAuthKit } from 'src/application/authkit';
import { useIdentifyUser } from 'src/application/posthog';
import { isSessionToken, setAuthKitToken, setToken } from 'src/application/token';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';

import { ApiError } from '../api-error';
import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';
import { apiMutation, apiQuery, getApiQueryKey } from '../query';

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
  const getSeonFingerprint = useSeon();
  const authKit = useAuthKit();
  const queryClient = useQueryClient();

  return useMutation({
    ...apiMutation('post /v1/organizations/{id}/switch', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess({ token }) {
      if (!authKit.user) {
        setToken(token!.id!);
      }

      await queryClient.refetchQueries({ queryKey: getApiQueryKey('get /v1/account/organization', {}) });
      queryClient.removeQueries({ predicate: (query) => !query.isActive() });
      void queryClient.invalidateQueries();

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
  const queryClient = useQueryClient();
  const authKit = useAuthKit();
  const userQuery = useUserQuery();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const apiLogout = useMutation({
    ...apiMutation('delete /v1/account/logout', {}),
    meta: { showError: !ApiError.isAccountLockedError(userQuery.error) },
    async onSettled() {
      if (!isSessionToken()) {
        clearIdentify();
      }

      queryClient.clear();
      setToken(null);
      await navigate({ to: '/auth/signin' });
    },
  });

  const authKitLogout = useMutation({
    mutationFn: async () => {
      authKit.signOut();
    },
    onSuccess: async () => {
      if (!isSessionToken()) {
        clearIdentify();
      }

      queryClient.clear();
      setAuthKitToken(null);
      await navigate({ to: '/auth/signin' });
    },
  });

  return authKit.user ? authKitLogout : apiLogout;
}
