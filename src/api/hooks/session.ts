import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';

import { useIdentifyUser } from 'src/application/posthog';
import { useNavigate } from 'src/hooks/router';

import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';
import { apiQuery } from '../query';

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
  const { switchToOrganization } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (organizationId: string) => switchToOrganization({ organizationId }),
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
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: async () => signOut({}),
    onSuccess: async () => {
      clearIdentify();
      await navigate({ to: '/auth/signin' });
    },
  });
}
