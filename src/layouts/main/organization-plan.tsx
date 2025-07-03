import { Badge, Floating, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { isAfter } from 'date-fns';
import { useState } from 'react';

import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { IconChevronRight } from 'src/components/icons';
import { LinkButton } from 'src/components/link';
import { PlanIcon } from 'src/components/plan-icon';
import { useObserve } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { TrialSummaryPopup } from 'src/modules/trial/trial-summary-popup';
import { useTrial } from 'src/modules/trial/use-trial';

import { EstimatedCostsPopup } from './estimated-costs-popup';

const T = createTranslate('layouts.main.organizationPlan');

export function OrganizationPlan() {
  const organization = useOrganizationUnsafe();
  const trial = useTrial();
  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useObserve(location, () => {
    setOpen(false);
  });

  if (organization === undefined) {
    return null;
  }

  if (organization.plan === 'hobby') {
    return <HobbyPlan />;
  }

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      hover
      strategy="fixed"
      placement={isMobile ? 'top-end' : 'right-end'}
      offset={8}
      renderReference={(props) => (
        <div
          className={clsx('col gap-4 py-2 pr-2 pl-3 text-start transition-colors', open && 'bg-muted/50')}
          {...props}
        >
          <div className="row items-center gap-2">
            <div>
              <PlanIcon plan={organization.plan} className="size-6 text-dim" />
            </div>

            <div>
              <T
                id="currentPlan"
                values={{ plan: <TranslateEnum enum="plans" value={organization.plan} /> }}
              />
            </div>

            {trial && (
              <Badge size={1} color="green">
                Trial
              </Badge>
            )}

            <div className="ms-auto">
              <IconChevronRight className="size-4 text-dim" />
            </div>
          </div>

          {trial && (
            <LinkButton variant="outline" size={1} to="/settings/plans" className="w-full">
              <T id="upgrade" />
            </LinkButton>
          )}
        </div>
      )}
      renderFloating={(props) =>
        trial ? (
          <TrialSummaryPopup className="z-50" {...props} />
        ) : (
          <EstimatedCostsPopup className="z-50" {...props} />
        )
      }
    />
  );
}

function HobbyPlan() {
  return (
    <div className="col gap-3 px-3 py-2">
      <div className="row items-center justify-between gap-2">
        <T id="currentPlan" values={{ plan: <TranslateEnum enum="plans" value="hobby" /> }} />

        <Badge size={1} color="green">
          <T id="free" />
        </Badge>
      </div>

      <div className="col gap-1">
        <div>
          <T id="upsell.title" />
        </div>

        <div className="text-xs text-dim">
          <T
            id={isAfter(new Date(), '2025-02-01T00:00Z') ? 'upsell.description.new' : 'upsell.description'}
          />
        </div>
      </div>

      <LinkButton color="gray" size={1} to="/settings/plans" className="w-full">
        <T id="upsell.cta" />
      </LinkButton>
    </div>
  );
}
