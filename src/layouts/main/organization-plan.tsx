import clsx from 'clsx';
import { useState } from 'react';

import { Badge, Floating, useBreakpoint } from '@koyeb/design-system';
import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { PlanIcon } from 'src/components/plan-icon';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useObserve } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';
import { createTranslate, TranslateEnum } from 'src/intl/translate';
import { TrialSummaryPopup } from 'src/modules/trial/trial-summary-popup';

import { EstimatedCostsPopup } from './estimated-costs-popup';

const T = createTranslate('layouts.main.organizationPlan');

export function OrganizationPlan() {
  const organization = useOrganizationUnsafe();
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
      renderReference={(ref, props) => (
        <div
          ref={ref}
          className={clsx('col gap-4 px-3 py-2 text-start transition-colors', open && 'bg-muted/50')}
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

            <FeatureFlag feature="trial">
              {organization.trial && (
                <Badge size={1} color="green" className="ms-auto">
                  Trial
                </Badge>
              )}
            </FeatureFlag>
          </div>

          {organization?.trial && (
            <LinkButton
              variant="outline"
              size={1}
              href={routes.organizationSettings.plans()}
              className="w-full"
            >
              <T id="upgrade" />
            </LinkButton>
          )}
        </div>
      )}
      renderFloating={(ref, props) => (
        <FeatureFlag feature="trial" fallback={<EstimatedCostsPopup ref={ref} className="z-30" {...props} />}>
          {organization.trial ? (
            <TrialSummaryPopup ref={ref} className="z-30" {...props} />
          ) : (
            <EstimatedCostsPopup ref={ref} className="z-30" {...props} />
          )}
        </FeatureFlag>
      )}
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
          <T id="upsell.description" />
        </div>
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.plans()} className="w-full">
        <T id="upsell.cta" />
      </LinkButton>
    </div>
  );
}
