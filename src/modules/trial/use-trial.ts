import { intervalToDuration, isAfter } from 'date-fns';

import { useSubscriptionQuery } from 'src/api/hooks/billing';
import { useOrganizationUnsafe } from 'src/api/hooks/session';

export function useTrial() {
  const organization = useOrganizationUnsafe();
  const { data: subscription } = useSubscriptionQuery(organization?.latestSubscriptionId);

  if (!organization?.trial || !subscription?.trial) {
    return null;
  }

  const { days = 0 } = intervalToDuration({
    start: new Date(),
    end: subscription.trial.endsAt,
  });

  return {
    ended: isAfter(new Date(), organization.trial.endsAt),
    daysLeft: Number(days) + 1,
    credits: subscription.trial,
  };
}
