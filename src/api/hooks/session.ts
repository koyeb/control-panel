import { useQuery } from '@tanstack/react-query';

import { AssertionError, defined } from 'src/utils/assert';

import { isApiError } from '../api-errors';
import { mapOrganization, mapOrganizationQuotas, mapOrganizationSummary, mapUser } from '../mappers/session';
import { useApiQueryFn } from '../use-api';

export function useUserQuery() {
  return useQuery({
    ...useApiQueryFn('getCurrentUser'),
    select: mapUser,
    throwOnError: (error) => {
      if (!isApiError(error)) {
        return true;
      }

      return error.code !== 'authentication_error';
    },
  });
}

export function useUser() {
  return defined(useUserQuery().data, new AssertionError('User is not set'));
}

export function useOrganizationQuery() {
  return useQuery({
    ...useApiQueryFn('getCurrentOrganization'),
    select: mapOrganization,
    throwOnError: (error) => {
      if (!isApiError(error)) {
        return true;
      }

      return error.code !== 'authentication_error' && error.code !== 'not_found';
    },
  });
}

export function useOrganizationUnsafe() {
  return useOrganizationQuery().data;
}

export function useOrganization() {
  return defined(useOrganizationUnsafe(), new AssertionError('Organization is not set'));
}

export function useOrganizationSummaryQuery() {
  const { data: organization } = useOrganizationQuery();
  const organizationId = organization?.id;

  return useQuery({
    ...useApiQueryFn('organizationSummary', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    select: mapOrganizationSummary,
  });
}

export function useOrganizationSummary() {
  return useOrganizationSummaryQuery().data;
}

export function useOrganizationQuotasQuery() {
  const { data: organization } = useOrganizationQuery();
  const organizationId = organization?.id;

  return useQuery({
    ...useApiQueryFn('organizationQuotas', { path: { organization_id: organizationId! } }),
    enabled: organizationId !== undefined,
    select: mapOrganizationQuotas,
  });
}

export function useOrganizationQuotas() {
  return useOrganizationQuotasQuery().data;
}
