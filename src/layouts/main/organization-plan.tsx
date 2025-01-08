import clsx from 'clsx';
import React, { forwardRef, Fragment, useState } from 'react';
import { FormattedNumber } from 'react-intl';

import { Badge, Floating, useBreakpoint } from '@koyeb/design-system';
import { useNextInvoiceQuery } from 'src/api/hooks/billing';
import { useOrganization, useOrganizationUnsafe } from 'src/api/hooks/session';
import { Invoice, InvoiceLine, InvoicePlanLine, InvoiceUsageLine } from 'src/api/model';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { PlanIcon } from 'src/components/plan-icon';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useObserve } from 'src/hooks/lifecycle';
import { useLocation } from 'src/hooks/router';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, TranslateEnum } from 'src/intl/translate';
import { TrialSummaryPopup } from 'src/modules/trial/trial-summary-popup';

const T = createTranslate('layouts.main.organizationPlan');

export function OrganizationPlan() {
  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);
  const organization = useOrganizationUnsafe();
  const trial = useFeatureFlag('trial') && organization?.trial !== undefined;

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

            {trial && (
              <Badge size={1} color="green" className="ms-auto">
                Trial
              </Badge>
            )}
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
      renderFloating={(ref, props) =>
        trial ? (
          <TrialSummaryPopup ref={ref} className="z-30" {...props} />
        ) : (
          <EstimatedCostsPopup ref={ref} className="z-30" {...props} />
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
          <T id="upsell.description" />
        </div>
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.plans()} className="w-full">
        <T id="upsell.cta" />
      </LinkButton>
    </div>
  );
}

export const EstimatedCostsPopup = forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  function EstimatedCostsPopup({ className, ...props }, ref) {
    const organization = useOrganization();
    const nextInvoiceQuery = useNextInvoiceQuery();

    return (
      <div ref={ref} className={clsx('w-56 rounded-md border bg-popover', className)} {...props}>
        <div className="p-3 font-medium">
          <T id="currentPlan" values={{ plan: <TranslateEnum enum="plans" value={organization.plan} /> }} />
        </div>

        <hr />

        {nextInvoiceQuery.isLoading && <Loading className="min-h-12" />}
        {nextInvoiceQuery.isSuccess && <CostsDetails costs={getCosts(nextInvoiceQuery.data)} />}
      </div>
    );
  },
);

function CostsDetails({ costs }: { costs: ReturnType<typeof getCosts> }) {
  return (
    <div className="col gap-3 p-3">
      <div className="row items-center justify-between text-dim">
        <div>
          <T id="estimatedCost.plan" />
        </div>
        <div>
          <FormattedPrice value={costs.plan ? costs.plan.total / 100 : 0} />
        </div>
      </div>

      <hr />

      <div className="row items-center justify-between text-dim">
        <div>
          <T id="estimatedCost.usage" />
        </div>
        <div>
          <FormattedPrice value={costs.usage / 100} />
        </div>
      </div>

      <hr />

      {costs.discounts.map((discount, index) => (
        <Fragment key={index}>
          <div className="row items-center justify-between text-green">
            <div>{discount.label}</div>
            <div>
              {discount.type === 'amountOff' && <FormattedPrice value={-discount.value / 100} />}
              {discount.type === 'percentOff' && (
                <FormattedNumber value={-discount.value / 100} style="percent" />
              )}
            </div>
          </div>

          <hr />
        </Fragment>
      ))}

      <div className="row items-center justify-between font-medium">
        <div>
          <T id="estimatedCost.estimatedCost" />
        </div>
        <div>
          <FormattedPrice value={costs.total / 100} />
        </div>
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.billing()} className="mt-1">
        <T id="estimatedCost.cta" />
      </LinkButton>
    </div>
  );
}

const isUsageLine = (line: InvoiceLine): line is InvoiceUsageLine => line.type === 'usage';
const isPlanLine = (line: InvoiceLine): line is InvoicePlanLine => line.type === 'plan';

function getCosts(invoice: Invoice) {
  return {
    usage: invoice.periods
      .flatMap((period) => period.lines.filter(isUsageLine))
      .reduce((total, line) => total + line.total, 0),
    plan: invoice.periods.find((period) => period.lines.find(isPlanLine))?.lines[0],
    discounts: invoice.discounts,
    total: invoice.total,
  };
}
