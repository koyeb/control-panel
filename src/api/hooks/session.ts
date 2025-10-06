import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import { useAuthKit } from 'src/application/authkit';
import { useIdentifyUser } from 'src/application/posthog';
import { isSessionToken, setAuthKitToken, setToken } from 'src/application/token';
import { ValidateLinkOptions } from 'src/components/link';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';

import { ApiEndpoint } from '../api';
import { ApiError } from '../api-error';
import {
  mapOrganization,
  mapOrganizationMember,
  mapOrganizationQuotas,
  mapOrganizationSummary,
  mapUser,
} from '../mappers/session';
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
  const getSeonFingerprint = useSeon();
  const authKit = useAuthKit();
  const queryClient = useQueryClient();

  return useMutation({
    ...apiMutation('post /v1/organizations/{id}/switch', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess({ token }) {
      const queriesToRemove = [
        'get /v1/organizations/{organization_id}/budget',
        'get /v1/organizations/{organization_id}/quotas',
        'get /v1/organizations/{organization_id}/summary',
        'get /v1/subscriptions/{id}',
      ] satisfies ApiEndpoint[];

      queriesToRemove.map((endpoint) => queryClient.removeQueries({ queryKey: [endpoint] }));

      if (!authKit.user) {
        void setToken(token!.id!, { queryClient });
      } else {
        void queryClient.invalidateQueries();
      }

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

export function useUserOrganizationMemberships() {
  const user = useUser();

  return useQuery({
    ...apiQuery('get /v1/organization_members', { query: { user_id: user?.id } }),
    refetchInterval: false,
    enabled: user !== undefined,
    select: ({ members }) => members!.map(mapOrganizationMember),
  });
}

export function useLogoutMutation(redirect: ValidateLinkOptions['to']) {
  const queryClient = useQueryClient();
  const authKit = useAuthKit();
  const userQuery = useUserQuery();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const apiLogout = useMutation({
    ...apiMutation('delete /v1/account/logout', {}),
    meta: { showError: !ApiError.isAccountLockedError(userQuery.error) },
    async onSettled() {
      const session = isSessionToken();

      if (!session) {
        clearIdentify();
      }

      await setToken(null, { queryClient, session });
      await navigate(urlToLinkOptions(redirect));
    },
  });

  const authKitLogout = useMutation({
    mutationFn: async () => {
      authKit.client?.signOut({ returnTo: `${window.location.origin}/auth/signin` });
    },
    onSuccess: () => {
      const session = isSessionToken();

      if (!session) {
        clearIdentify();
      }

      setAuthKitToken(null);
    },
  });

  return authKit.user ? authKitLogout : apiLogout;
}
