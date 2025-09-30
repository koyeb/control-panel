import { useQuery } from '@tanstack/react-query';

import { apiQuery } from 'src/api/api';
import { inArray } from 'src/utils/arrays';

import { mapInvoice, mapSubscription } from '../mappers/billing';

import { useOrganization, useOrganizationQuery } from './session';

export function useManageBillingQuery() {
  const organization = useOrganization();

  return useQuery({
    enabled: organization.latestSubscriptionId !== undefined && !organization.trial,
    ...apiQuery('get /v1/billing/manage', {}),
  });
}

export function useSubscriptionQuery(subscriptionId: string | undefined) {
  const organizationQuery = useOrganizationQuery();

  return useQuery({
    ...apiQuery('get /v1/subscriptions/{id}', { path: { id: subscriptionId as string } }),
    enabled: subscriptionId !== undefined && !organizationQuery.isFetching,
    select: ({ subscription }) => mapSubscription(subscription!),
  });
}

export function useNextInvoiceQuery() {
  const organization = useOrganization();

  return useQuery({
    ...apiQuery('get /v1/billing/next_invoice', {}),
    enabled:
      !organization.trial &&
      inArray(organization.plan, ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise']),
    select: mapInvoice,
    meta: { showError: false },
  });
}
