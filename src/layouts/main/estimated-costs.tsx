import { FormattedNumber } from 'react-intl';

import { InfoTooltip } from '@koyeb/design-system';
import { useNextInvoiceQuery } from 'src/api/hooks/billing';
import { useOrganizationQuery } from 'src/api/hooks/session';
import { Invoice } from 'src/api/model';
import { routes } from 'src/application/routes';
import { LinkButton } from 'src/components/link';
import { FormattedPrice } from 'src/intl/formatted';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.estimatedCost');

export function EstimatedCosts() {
  const organizationQuery = useOrganizationQuery();
  const organization = organizationQuery.data;

  const nextInvoiceQuery = useNextInvoiceQuery();
  const nextInvoice = nextInvoiceQuery.data;

  if (!organization) {
    return null;
  }

  return (
    <div className="mx-4 divide-y rounded-md border bg-neutral">
      <div className="row items-center gap-1 p-2 font-medium">
        <div className="capitalize">
          <T id="currentPlan" values={{ plan: organization.plan }} />
        </div>

        {nextInvoice && (
          <div>
            <InfoTooltip
              color="neutral"
              allowHover
              arrow={false}
              content={<CostsDetails invoice={nextInvoice} />}
              iconClassName="text-dim"
            />
          </div>
        )}

        {organization.plan !== 'hobby' && nextInvoice && (
          <div className="ml-auto">
            <FormattedPrice value={nextInvoice.total / 100} />
          </div>
        )}
      </div>

      {organization.plan === 'hobby' && (
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
      )}
    </div>
  );
}

function CostsDetails({ invoice }: { invoice: Invoice }) {
  return (
    <div className="col w-36 gap-2">
      <div className="row items-center justify-between gap-2 text-dim">
        <span>
          <T id="usage" />
        </span>
        <span>
          <FormattedPrice value={(invoice.totalWithoutDiscount ?? invoice.total) / 100} />
        </span>
      </div>

      {invoice.discount && (
        <div className="row items-center justify-between gap-2 text-green">
          <span className="truncate">{invoice.discount.label}</span>
          <span>
            {invoice.discount.type === 'amountOff' && (
              <FormattedPrice value={-invoice.discount.value / 100} />
            )}
            {invoice.discount.type === 'percentOff' && (
              <FormattedNumber value={-invoice.discount.value / 100} style="percent" />
            )}
          </span>
        </div>
      )}

      <hr />

      <div className="row items-center justify-between gap-2 font-medium">
        <span>
          <T id="estimatedCost" />
        </span>
        <span>
          <FormattedPrice value={invoice.total / 100} />
        </span>
      </div>
    </div>
  );
}
