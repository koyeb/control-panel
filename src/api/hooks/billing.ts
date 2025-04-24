import { useQuery } from '@tanstack/react-query';

import { inArray } from 'src/utils/arrays';

import { mapInvoice, mapSubscription } from '../mappers/billing';
import { useApiQueryFn } from '../use-api';

import { useOrganization } from './session';

export function useManageBillingQuery() {
  const organization = useOrganization();

  return useQuery({
    enabled: organization.latestSubscriptionId !== undefined && !organization.trial,
    ...useApiQueryFn('manageBilling'),
  });
}

export function useSubscriptionQuery(subscriptionId: string | undefined) {
  return useQuery({
    ...useApiQueryFn('getSubscription', { path: { id: subscriptionId! } }),
    enabled: subscriptionId !== undefined,
    select: ({ subscription }) => mapSubscription(subscription!),
  });
}

export function useNextInvoiceQuery() {
  const organization = useOrganization();

  return useQuery({
    ...useApiQueryFn('getNextInvoice'),
    enabled:
      !organization.trial &&
      inArray(organization.plan, ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise']),
    select: mapInvoice,
    meta: { showError: false },
  });
}
