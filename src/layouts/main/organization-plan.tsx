import {
  FloatingPortal,
  offset,
  safePolygon,
  useFloating,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react';
import { Badge, useBreakpoint } from '@koyeb/design-system';
import { isAfter } from 'date-fns';
import { useState } from 'react';

import { useOrganization } from 'src/api';
import { LinkButton } from 'src/components/link';
import { PlanIcon } from 'src/components/plan-icon';
import { useObserve } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';
import { IconChevronRight } from 'src/icons';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { TrialSummaryPopup } from 'src/modules/trial/trial-summary-popup';
import { useTrial } from 'src/modules/trial/use-trial';

import { EstimatedCostsPopup } from './estimated-costs-popup';

const T = createTranslate('layouts.main.organizationPlan');

export function OrganizationPlan() {
  const organization = useOrganization();
  const trial = useTrial();
  const isMobile = !useBreakpoint('sm');
  const location = useLocation();

  const [open, setOpen] = useState(false);

  const floating = useFloating({
    open,
    onOpenChange: setOpen,
    strategy: 'fixed',
    placement: isMobile ? 'top-end' : 'right-end',
    middleware: [offset(8)],
  });

  const transition = useTransitionStyles(floating.context, {
    duration: 100,
  });

  const hover = useHover(floating.context, {
    enabled: true,
    handleClose: safePolygon(),
  });

  const role = useRole(floating.context, { role: 'menu' });

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, role]);

  useObserve(location, () => {
    floating.context.onOpenChange(false);
  });

  if (organization === undefined) {
    return null;
  }

  if (organization.plan === 'hobby') {
    return <HobbyPlan />;
  }

  const Component = trial ? TrialSummaryPopup : EstimatedCostsPopup;

  return (
    <>
      <div
        {...getReferenceProps({ ref: floating.refs.setReference })}
        role="menuitem"
        className="col gap-4 py-2 pr-2 pl-3 text-start transition-colors hover:bg-muted/50"
      >
        <div className="row items-center gap-2">
          <div>
            <PlanIcon plan={organization.plan} className="size-6 text-dim" />
          </div>

          <div>
            <T id="currentPlan" values={{ plan: <TranslateEnum enum="plans" value={organization.plan} /> }} />
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

      {transition.isMounted && (
        <FloatingPortal root={document.getElementById('root')}>
          <Component
            {...getFloatingProps({ ref: floating.refs.setFloating })}
            style={{ ...floating.floatingStyles, ...transition.styles }}
            className="z-50"
          />
        </FloatingPortal>
      )}
    </>
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
