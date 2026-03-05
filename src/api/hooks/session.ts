import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { unstable_useWidgetsInvalidator as useWidgetsInvalidator } from '@workos-inc/widgets/utils';
// eslint-disable-next-line no-restricted-imports
import { usePostHog } from 'posthog-js/react';

import { apiQuery, refetchInterval } from 'src/api';

import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';

import { useCurrentProjectId } from './project';

export function useUserQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/profile', {}),
    refetchInterval: refetchInterval(),
    select: (result) => mapUser(result.user!),
  });
}

export function useUser() {
  return useUserQuery().data;
}

export function useOrganizationQuery() {
  return useQuery({
    ...apiQuery('get /v1/account/organization', {}),
    refetchInterval: refetchInterval(),
    select: (result) => mapOrganization(result.organization!),
  });
}

export function useOrganization() {
  return useOrganizationQuery().data;
}

export function useSwitchOrganization({ onSuccess }: { onSuccess?: () => void | Promise<void> } = {}) {
  const posthog = usePostHog();
  const queryClient = useQueryClient();
  const { switchToOrganization } = useAuth();
  const [, setCurrentProjectId] = useCurrentProjectId();
  const invalidateWidgets = useWidgetsInvalidator();

  return useMutation({
    mutationFn: (externalId: string) => switchToOrganization({ organizationId: externalId }),
    async onSuccess() {
      await queryClient.cancelQueries();

      const organization = await queryClient
        .fetchQuery(apiQuery('get /v1/account/organization', {}))
        .then(({ organization }) => mapOrganization(organization!));

      posthog.group('segment_group', organization.id);

      await queryClient.fetchQuery(
        apiQuery('get /v1/projects/{id}', { path: { id: organization.defaultProjectId } }),
      );

      setCurrentProjectId(organization.defaultProjectId);

      await queryClient.invalidateQueries();
      queryClient.removeQueries({ predicate: (query) => !query.isActive() });

      await invalidateWidgets();

      await onSuccess?.();
    },
  });
}

export function useOrganizationsList({ search, limit }: { search?: string; limit?: number } = {}) {
  const { data } = useQuery({
    ...apiQuery('get /v1/account/organizations', {
      query: {
        search: search || undefined,
        limit: limit ? String(limit) : undefined,
        statuses: ['ACTIVE', 'WARNING', 'LOCKED', 'DEACTIVATING', 'DEACTIVATED'],
      },
    }),
    placeholderData: keepPreviousData,
    select: ({ organizations }) => organizations!.map(mapOrganization),
  });

  return data ?? [];
}

export function useOrganizationSummaryQuery() {
  const organization = useOrganization();

  return useSuspenseQuery({
    ...apiQuery('get /v1/organizations/{organization_id}/summary', {
      path: { organization_id: organization?.id as string },
    }),
    refetchInterval: refetchInterval(),
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
    select: ({ quotas }) => mapOrganizationQuotas(quotas!),
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}
