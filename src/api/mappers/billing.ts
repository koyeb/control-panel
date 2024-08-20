import { sub } from 'date-fns';

import { isDefined } from 'src/utils/generic';

import { ApiEndpointResult } from '../api';
import { Invoice, InvoiceDiscount, InvoiceLine, Subscription } from '../model';

export function mapSubscription({ subscription }: ApiEndpointResult<'getSubscription'>): Subscription {
  return {
    id: subscription!.id!,
    hasPaymentFailure: subscription!.payment_failure !== null,
    hasPendingUpdate: subscription!.has_pending_update!,
  };
}

export type StripeInvoice = {
  discount?: { coupon?: StripeInvoiceCoupon };
  lines: { data: StripeInvoiceLine[] };
  subtotal_excluding_tax: number;
  total_excluding_tax: number;
};

export type StripeInvoiceLine = {
  amount_excluding_tax: number;
  period: { start: number; end: number };
  plan: { nickname: string };
  price: { unit_amount_decimal: string };
  quantity: number; // seconds
};

export type StripeInvoiceCoupon = {
  amount_off: number | null;
  name: string;
  percent_off: number | null;
};

export function mapInvoice({ stripe_invoice }: ApiEndpointResult<'getNextInvoice'>): Invoice {
  const stripeInvoice = stripe_invoice as unknown as StripeInvoice;

  const invoice: Invoice = {
    periods: groupLinesByPeriod(stripeInvoice.lines.data)
      .map(({ start, end, lines }) => ({
        start: transformPeriodStart(start),
        end: transformPeriodEnd(end),
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

function transformPeriodStart(start: number): string {
  return new Date(1000 * start).toISOString();
}

function transformPeriodEnd(end: number): string {
  return sub(1000 * end, { days: 1 }).toISOString();
}

function getLines(lines: StripeInvoiceLine[]): InvoiceLine[] {
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

function transformLine(line: StripeInvoiceLine): InvoiceLine | undefined {
  if (line.plan.nickname === 'Starter') {
    return;
  }

  if (line.plan.nickname === 'Startup') {
    return {
      label: line.plan.nickname,
      total: line.amount_excluding_tax,
    };
  }

  return {
    label: line.plan.nickname,
    price: Number(line.price.unit_amount_decimal),
    usage: line.quantity,
    total: line.amount_excluding_tax,
  };
}

function groupLinesByPeriod(
  lines: StripeInvoiceLine[],
): Array<{ start: number; end: number; lines: StripeInvoiceLine[] }> {
  const periods = new Map<string, { start: number; end: number; lines: StripeInvoiceLine[] }>();

  for (const line of lines) {
    const { start, end } = line.period;
    const key = `${start}-${end}`;

    if (!periods.has(key)) {
      periods.set(key, { start, end, lines: [] });
    }

    periods.get(key)?.lines.push(line);
  }

  return Array.from(periods.values()).sort(({ start: a }, { start: b }) => a - b);
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
