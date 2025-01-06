import { sub } from 'date-fns';

import { isDefined } from 'src/utils/generic';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import { Invoice, InvoiceDiscount, InvoiceLine, Subscription } from '../model';

export function mapSubscription({ subscription }: ApiEndpointResult<'getSubscription'>): Subscription {
  return {
    id: subscription!.id!,
    hasPaymentFailure: subscription!.payment_failure !== null,
    hasPendingUpdate: subscription!.has_pending_update!,
  };
}

export type StripeInvoice = {
  subtotal_excluding_tax: number;
  total_excluding_tax: number;
};

export function mapInvoice({
  lines,
  stripe_invoice,
  discounts,
}: ApiEndpointResult<'getNextInvoice'>): Invoice {
  const stripeInvoice = stripe_invoice as unknown as StripeInvoice;

  return {
    periods: groupLinesByPeriod(lines!)
      .map(({ start, end, lines }) => ({
        start,
        end: sub(end, { days: 1 }).toISOString(),
        lines: getLines(lines),
      }))
      .filter(({ lines }) => lines.length > 0),
    total: stripeInvoice.total_excluding_tax,
    totalWithoutDiscount: stripeInvoice.subtotal_excluding_tax,
    discounts: discounts!.map(mapDiscount),
  };
}

function getLines(lines: Api.NextInvoiceLine[]): InvoiceLine[] {
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

function transformLine(line: Api.NextInvoiceLine): InvoiceLine | undefined {
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
  lines: Api.NextInvoiceLine[],
): Array<{ start: string; end: string; lines: Api.NextInvoiceLine[] }> {
  const periods = new Map<string, { start: string; end: string; lines: Api.NextInvoiceLine[] }>();

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

function mapDiscount(discount: Api.NextInvoiceDiscount): InvoiceDiscount {
  const type = discountTypeMap[discount.type!]!;

  return {
    label: discount.name!,
    type,
    value: type === 'amountOff' ? Number(discount.amount) : Number(discount.amount) / 100,
  };
}

const discountTypeMap: Record<string, InvoiceDiscount['type']> = {
  AMOUNT_OFF: 'amountOff',
  PERCENT_OFF: 'percentOff',
};
