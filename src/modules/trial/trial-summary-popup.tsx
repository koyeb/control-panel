import clsx from 'clsx';
import { intervalToDuration } from 'date-fns';

import { Badge, ProgressBar } from '@koyeb/design-system';
import { useSubscriptionQuery } from 'src/api/hooks/billing';
import { useOrganization } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, TranslateEnum } from 'src/intl/translate';
import { assert, AssertionError } from 'src/utils/assert';

const T = createTranslate('modules.trial.summaryPopup');

type TrialSummaryPopupProps = React.ComponentProps<'div'>;

export function TrialSummaryPopup({ className, ...props }: TrialSummaryPopupProps) {
  const organization = useOrganization();
  const { data: subscription } = useSubscriptionQuery(organization.latestSubscriptionId);

  if (!subscription) {
    return <Loading {...props} className={clsx('w-56 rounded-md border bg-popover', className)} />;
  }

  assert(organization.trial !== undefined, new AssertionError('Organization is not in trial'));
  assert(subscription.trial !== undefined, new AssertionError('Subscription is not in trial'));

  const { currentSpend, maxSpend } = subscription.trial;
  const { days } = intervalToDuration({ start: new Date(), end: organization.trial.endsAt });

  return (
    <div {...props} className={clsx('w-56 rounded-md border bg-popover', className)}>
      <div className="row justify-between border-b p-3">
        <T id="currentPlan" values={{ plan: <TranslateEnum enum="plans" value={organization.plan} /> }} />

        <Badge size={1} color="green" className="ms-auto">
          <T id="badge" />
        </Badge>
      </div>

      <div className="col gap-3 p-3">
        <div className="row justify-between text-dim">
          <div>
            <T id="usage" />
          </div>
          <div>
            <FormattedPrice value={currentSpend / 100} />
          </div>
        </div>

        <hr />

        <div className="row justify-between">
          <div className="font-medium">
            <T id="creditLeft" />
          </div>
          <div className="text-green">
            <FormattedPrice value={maxSpend / 100} />
          </div>
        </div>

        <ProgressBar progress={currentSpend / maxSpend} label={false} />

        <div className="text-center text-xs text-dim">
          <T id="timeLeft" values={{ days: Number(days) + 1 }} />
        </div>

        <LinkButton color="gray" size={1} href={routes.organizationSettings.billing()}>
          <T id="cta" />
        </LinkButton>
      </div>
    </div>
  );
}
