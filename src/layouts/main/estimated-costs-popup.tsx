import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';
import { FormattedNumber } from 'react-intl';

import { useNextInvoiceQuery } from 'src/api/hooks/billing';
import { useOrganization } from 'src/api/hooks/session';
import { Invoice, InvoiceLine, InvoicePlanLine, InvoiceUsageLine } from 'src/api/model';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('layouts.main.organizationPlan.estimatedCost');

export function EstimatedCostsPopup({ className, ...props }: React.ComponentProps<'div'>) {
  const organization = useOrganization();
  const nextInvoiceQuery = useNextInvoiceQuery();

  return (
    <div className={clsx('w-56 rounded-md border bg-popover', className)} {...props}>
      <div className="p-3 font-medium">
        <T id="currentPlan" values={{ plan: <TranslateEnum enum="plans" value={organization.plan} /> }} />
      </div>

      <hr />

      {nextInvoiceQuery.isPending && <Loading className="min-h-12" />}
      {nextInvoiceQuery.isSuccess && <CostsDetails costs={getCosts(nextInvoiceQuery.data)} />}
    </div>
  );
}

function CostsDetails({ costs }: { costs: ReturnType<typeof getCosts> }) {
  return (
    <div className="col gap-3 p-3">
      <div className="row items-center justify-between text-dim">
        <div>
          <T id="plan" />
        </div>
        <div>
          <FormattedPrice value={costs.plan ? costs.plan.total / 100 : 0} />
        </div>
      </div>

      <hr />

      <div className="row items-center justify-between text-dim">
        <div>
          <T id="usage" />
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
          <T id="estimatedCost" />
        </div>
        <div>
          <FormattedPrice value={costs.total / 100} />
        </div>
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.billing()} className="mt-1">
        <T id="cta" />
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
