import { intervalToDuration, isAfter } from 'date-fns';

import { useOrganization, useSubscriptionQuery } from 'src/api';

export function useTrial() {
  const organization = useOrganization();
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
