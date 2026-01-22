import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';

import { inArray } from 'src/utils/arrays';

import { mapInvoice, mapSubscription } from '../mappers/billing';
import { apiQuery } from '../query';

import { useOrganization, useOrganizationQuery } from './session';

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
  const { getAccessToken } = useAuth();

  return useQuery({
    ...apiQuery('get /v1/billing/next_invoice', {}),
    enabled:
      !organization?.trial &&
      inArray(organization?.plan, ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise']),
    select: mapInvoice,
    meta: { getAccessToken, showError: false },
  });
}
