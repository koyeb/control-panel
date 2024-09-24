import { sub } from 'date-fns';

import { isDefined } from 'src/utils/generic';

import { ApiEndpointResult } from '../api';
import { ApiNextInvoiceLine } from '../api-types';
import { Invoice, InvoiceDiscount, InvoiceLine, Subscription } from '../model';

export function mapSubscription({ subscription }: ApiEndpointResult<'getSubscription'>): Subscription {
  return {
    id: subscription!.id!,
    hasPaymentFailure: subscription!.payment_failure !== null,
    hasPendingUpdate: subscription!.has_pending_update!,
  };
}

export type StripeInvoice = {
  discount?: { coupon?: StripeInvoiceCoupon } | null;
  subtotal_excluding_tax: number;
  total_excluding_tax: number;
};

export type StripeInvoiceCoupon = {
  name: string;
  amount_off: number | null;
  percent_off: number | null;
};

export function mapInvoice({ lines, stripe_invoice }: ApiEndpointResult<'getNextInvoice'>): Invoice {
  const stripeInvoice = stripe_invoice as unknown as StripeInvoice;

  const invoice: Invoice = {
    periods: groupLinesByPeriod(lines!)
      .map(({ start, end, lines }) => ({
        start,
        end: sub(end, { days: 1 }).toISOString(),
        lines: getLines(lines),
      }))
      .filter(({ lines }) => lines.length > 0),
    total: stripeInvoice.total_excluding_tax,
  };

  const discount = getDiscount(stripeInvoice);

  if (discount) {
    invoice.discount = discount;
    invoice.totalWithoutDiscount = stripeInvoice.subtotal_excluding_tax;
  }

  return invoice;
}

function getLines(lines: ApiNextInvoiceLine[]): InvoiceLine[] {
  return lines
    .map(transformLine)
    .filter(isDefined)
    .sort((a: InvoiceLine, b: InvoiceLine) => {
      if ('price' in a && 'price' in b) {
        return a.price - b.price;
      }

      return 0;
    });
}

function transformLine(line: ApiNextInvoiceLine): InvoiceLine | undefined {
  if (line.plan_nickname === 'Starter') {
    return;
  }

  if (line.plan_nickname === 'Startup') {
    return {
      type: 'plan',
      label: line.plan_nickname,
      total: line.amount_excluding_tax!,
    };
  }

  return {
    type: 'usage',
    label: line.plan_nickname!,
    price: line.price!.unit_amount_decimal!,
    usage: line.quantity!,
    total: line.amount_excluding_tax!,
  };
}

function groupLinesByPeriod(
  lines: ApiNextInvoiceLine[],
): Array<{ start: string; end: string; lines: ApiNextInvoiceLine[] }> {
  const periods = new Map<string, { start: string; end: string; lines: ApiNextInvoiceLine[] }>();

  for (const line of lines) {
    const { start, end } = line.period as { start: string; end: string };
    const key = `${start}-${end}`;

    if (!periods.has(key)) {
      periods.set(key, { start, end, lines: [] });
    }

    periods.get(key)?.lines.push(line);
  }

  return Array.from(periods.values()).sort(({ start: a }, { start: b }) => a.localeCompare(b));
}

function getDiscount(invoice: StripeInvoice): InvoiceDiscount | undefined {
  const coupon = invoice.discount?.coupon;

  if (!coupon) {
    return;
  }

  if (coupon.amount_off !== null) {
    return {
      type: 'amountOff',
      label: coupon.name,
      value: coupon.amount_off,
    };
  }

  if (coupon.percent_off !== null) {
    return {
      type: 'percentOff',
      label: coupon.name,
      value: coupon.percent_off,
    };
  }

  return {
    type: 'unknown',
    label: coupon.name,
    value: 0,
  };
}
