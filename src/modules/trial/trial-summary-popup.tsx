import clsx from 'clsx';
import { forwardRef } from 'react';

import { Badge, ProgressBar } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('modules.trial.summaryPopup');

type TrialSummaryPopupProps = React.ComponentProps<'div'>;

export const TrialSummaryPopup = forwardRef<HTMLDivElement, TrialSummaryPopupProps>(
  function TrialSummaryPopup({ className, ...props }, ref) {
    const organization = useOrganization();

    return (
      <div ref={ref} {...props} className={clsx('w-56 rounded-md border bg-popover', className)}>
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
            <div>$0.00</div>
          </div>

          <hr />

          <div className="row justify-between">
            <div className="font-medium">
              <T id="creditLeft" />
            </div>
            <div className="text-green">$10.00</div>
          </div>

          <ProgressBar progress={1} label={false} />

          <div className="text-center text-xs text-dim">
            <T id="timeLeft" values={{ days: 7 }} />
          </div>

          <LinkButton color="gray" href={routes.organizationSettings.billing()}>
            <T id="cta" />
          </LinkButton>
        </div>
      </div>
    );
  },
);
