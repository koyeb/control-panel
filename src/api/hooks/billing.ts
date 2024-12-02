import { useQuery } from '@tanstack/react-query';

import { useToken } from 'src/application/token';
import { inArray } from 'src/utils/arrays';

import { api } from '../api';
import { ApiError } from '../api-errors';
import { mapInvoice, mapSubscription } from '../mappers/billing';
import { useApiQueryFn } from '../use-api';

import { useOrganizationQuery } from './session';

export function useManageBillingQuery() {
  const { token } = useToken();

  return useQuery({
    queryKey: ['manageBilling', { token }],
    async queryFn() {
      try {
        return await api.manageBilling({ token });
      } catch (error) {
        if (error instanceof ApiError && error.status === 400) {
          return null;
        }

        throw error;
      }
    },
  });
}

export function useSubscriptionQuery(subscriptionId: string | undefined) {
  return useQuery({
    ...useApiQueryFn('getSubscription', { path: { id: subscriptionId! } }),
    enabled: subscriptionId !== undefined,
    select: mapSubscription,
  });
}

export function useNextInvoiceQuery() {
  const { data: organization } = useOrganizationQuery();

  return useQuery({
    ...useApiQueryFn('getNextInvoice'),
    enabled: inArray(organization?.plan, ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise']),
    select: mapInvoice,
    meta: { showError: false },
  });
}
