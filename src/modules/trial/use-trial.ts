import { intervalToDuration, isAfter } from 'date-fns';

import { useOrganizationUnsafe, useSubscriptionQuery } from 'src/api';

export function useTrial() {
  const organization = useOrganizationUnsafe();
  const { data: subscription } = useSubscriptionQuery(organization?.latestSubscriptionId);

  if (!organization?.trial || !subscription?.trial) {
    return null;
  }

  const { days = 0 } = intervalToDuration({
    start: new Date(),
    end: organization.trial.endsAt,
  });

  return {
    ended: isAfter(new Date(), organization.trial.endsAt),
    daysLeft: days,
    credits: subscription.trial,
  };
}
