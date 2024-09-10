import { FormattedNumber } from 'react-intl';

import { useNextInvoiceQuery } from 'src/api/hooks/billing';
import { useOrganizationUnsafe } from 'src/api/hooks/session';
import { Invoice, InvoiceLine, InvoicePlanLine, InvoiceUsageLine } from 'src/api/model';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.estimatedCost');

export function EstimatedCosts() {
  const organization = useOrganizationUnsafe();
  const nextInvoiceQuery = useNextInvoiceQuery();

  if (!organization) {
    return null;
  }

  return (
    <div className="mx-4 divide-y rounded-md border bg-neutral">
      <div className="row justify-between p-2 font-medium">
        <div className="capitalize">
          <T id="currentPlan" values={{ plan: organization.plan }} />
        </div>

        {organization.plan === 'hobby' && <T id="free" />}
      </div>

      {organization.plan === 'hobby' ? (
        <Upsell />
      ) : (
        <>
          {nextInvoiceQuery.isLoading && <Loading className="min-h-12" />}
          {nextInvoiceQuery.isSuccess && <CostsDetails costs={getCosts(nextInvoiceQuery.data)} />}
        </>
      )}
    </div>
  );
}

function Upsell() {
  return (
    <div className="col gap-1 p-2">
      <div>
        <T id="upsell.title" />
      </div>

      <div className="text-xs text-dim">
        <T id="upsell.description" />
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.plans()} className="mt-2">
        <T id="upsell.cta" />
      </LinkButton>
    </div>
  );
}

function CostsDetails({ costs }: { costs: ReturnType<typeof getCosts> }) {
  return (
    <div className="col gap-2 p-2">
      {costs.plan !== undefined && (
        <div className="row items-center justify-between text-dim">
          <div>{costs.plan.label} plan</div>
          <div>
            <FormattedPrice value={costs.plan.total / 100} />
          </div>
        </div>
      )}

      <div className="row items-center justify-between text-dim">
        <div>
          <T id="usage" />
        </div>
        <div>
          <FormattedPrice value={costs.usage / 100} />
        </div>
      </div>

      {costs.discount && (
        <div className="row items-center justify-between text-green">
          <div>{costs.discount.label}</div>
          <div>
            {costs.discount.type === 'amountOff' && <FormattedPrice value={-costs.discount.value / 100} />}
            {costs.discount.type === 'percentOff' && (
              <FormattedNumber value={-costs.discount.value / 100} style="percent" />
            )}
          </div>
        </div>
      )}

      <hr />

      <div className="row items-center justify-between font-medium">
        <div>
          <T id="estimatedCost" />
        </div>
        <div>
          <FormattedPrice value={costs.total / 100} />
        </div>
      </div>

      <LinkButton color="gray" size={1} href={routes.organizationSettings.billing()} className="mt-1">
        <T id="viewBilling" />
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
    discount: invoice.discount,
    total: invoice.total,
  };
}
