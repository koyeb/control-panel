import { sub } from 'date-fns';

import { inArray } from 'src/utils/arrays';
import { isDefined } from 'src/utils/generic';

import type { Api } from '../api-types';
import { Invoice, InvoiceDiscount, InvoiceLine, Subscription } from '../model';

export function mapSubscription(subscription: Api.Subscription): Subscription {
  return {
    id: subscription.id!,
    hasPaymentFailure: subscription.payment_failure !== null,
    hasPendingUpdate: subscription.has_pending_update!,
    trial: subscription?.trialing
      ? {
          currentSpend: Number(subscription.current_spend),
          maxSpend: Number(subscription.trial_max_spend),
        }
      : undefined,
  };
}

export type StripeInvoice = {
  subtotal_excluding_tax: number;
  total_excluding_tax: number;
};

export function mapInvoice({ lines, stripe_invoice, discounts }: Api.NextInvoiceReply): Invoice {
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

function getLines(lines: Api.NextInvoiceReplyLine[]): InvoiceLine[] {
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

function transformLine(line: Api.NextInvoiceReplyLine): InvoiceLine | undefined {
  if (inArray(line.plan_nickname, ['Starter', 'Startup', 'Pro', 'Scale', 'Business', 'Enterprise'])) {
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
  lines: Api.NextInvoiceReplyLine[],
): Array<{ start: string; end: string; lines: Api.NextInvoiceReplyLine[] }> {
  const periods = new Map<string, { start: string; end: string; lines: Api.NextInvoiceReplyLine[] }>();

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

function mapDiscount(discount: Api.NextInvoiceReplyDiscount): InvoiceDiscount {
  const type = discountTypeMap[discount.type!]!;

  return {
    label: discount.name!,
    type,
    value: type === 'amountOff' ? Number(discount.amount) : Number(discount.amount) / (100 * 100),
  };
}

const discountTypeMap: Record<string, InvoiceDiscount['type']> = {
  AMOUNT_OFF: 'amountOff',
  PERCENT_OFF: 'percentOff',
};
