import { describe, expect, it } from 'vitest';

import { createDate } from 'src/utils/date';
import { createFactory } from 'src/utils/factories';

import type { API } from '../api-types';
import { Invoice, InvoiceDiscount, InvoicePlanLine, InvoiceUsageLine } from '../model';

import { StripeInvoice, mapInvoice } from './billing';

const createStripeInvoice = createFactory<StripeInvoice>(() => ({
  lines: [],
  discounts: [],
  subtotal_excluding_tax: 0,
  total_excluding_tax: 0,
}));

const date = createDate();

const createStripeInvoiceLine = createFactory<API.NextInvoiceReplyLine>(() => ({
  amount_excluding_tax: 0,
  period: { end: date, start: date },
  plan_nickname: '',
  price: { unit_amount_decimal: 0 },
  quantity: 0,
}));

describe('mapInvoice', () => {
  const transform = (
    invoice: StripeInvoice,
    lines: API.NextInvoiceReplyLine[],
    discounts: API.NextInvoiceReplyDiscount[] = [],
  ) => {
    return mapInvoice({ stripe_invoice: invoice as never, lines, discounts });
  };

  it('transforms an invoice from stripe', () => {
    const stripeInvoice = createStripeInvoice({
      total_excluding_tax: 774,
      subtotal_excluding_tax: 774,
    });

    const lines = [
      createStripeInvoiceLine({
        period: { end: '2023-06-01T00:00:00.000Z', start: '2023-05-01T00:00:00.000Z' },
        amount_excluding_tax: 774,
        plan_nickname: 'Small instance',
        price: { unit_amount_decimal: 0.0004 },
        quantity: 1935000,
      }),
    ];

    expect(transform(stripeInvoice, lines)).toEqual<Invoice>({
      periods: [
        {
          start: createDate('2023-05-01'),
          end: createDate('2023-05-31'),
          lines: [{ type: 'usage', label: 'Small instance', price: 0.0004, usage: 1935000, total: 774 }],
        },
      ],
      total: 774,
      totalWithoutDiscount: 774,
      discounts: [],
    });
  });

  it('transforms a plan invoice line', () => {
    const invoice = createStripeInvoice();

    const lines = [
      createStripeInvoiceLine({
        amount_excluding_tax: 2900,
        plan_nickname: 'Pro',
        price: { unit_amount_decimal: 2900 },
        quantity: 1,
      }),
    ];

    expect(transform(invoice, lines)).toHaveProperty<InvoicePlanLine[]>('periods.0.lines', [
      { type: 'plan', label: 'Pro', total: 2900 },
    ]);
  });

  it('returns the invoice lines sorted by price, database lines last', () => {
    const invoice = transform(createStripeInvoice(), [
      createStripeInvoiceLine({ plan_nickname: 'Usage 2', price: { unit_amount_decimal: 2 } }),
      createStripeInvoiceLine({ plan_nickname: 'Database stuff' }),
      createStripeInvoiceLine({ plan_nickname: 'Usage 1', price: { unit_amount_decimal: 1 } }),
    ]);

    const lines = invoice.periods[0]?.lines as InvoiceUsageLine[];

    expect(lines).toEqual([
      expect.objectContaining<Partial<InvoiceUsageLine>>({ label: 'Usage 1' }),
      expect.objectContaining<Partial<InvoiceUsageLine>>({ label: 'Usage 2' }),
      expect.objectContaining<Partial<InvoiceUsageLine>>({ label: 'Database stuff' }),
    ]);
  });

  it('transforms an amount off discount', () => {
    const stripeInvoice = createStripeInvoice({
      total_excluding_tax: 123 + 550,
      subtotal_excluding_tax: 123,
    });

    const discount: API.NextInvoiceReplyDiscount = {
      type: 'AMOUNT_OFF',
      name: 'Koyeb free tier',
      amount: '550',
    };

    expect(transform(stripeInvoice, [], [discount])).toHaveProperty('totalWithoutDiscount', 123);

    expect(transform(stripeInvoice, [], [discount])).toHaveProperty<InvoiceDiscount[]>('discounts', [
      {
        type: 'amountOff',
        label: 'Koyeb free tier',
        value: 550,
      },
    ]);
  });

  it('transforms a percent off discount', () => {
    const stripeInvoice = createStripeInvoice({
      subtotal_excluding_tax: 123,
    });

    const discount: API.NextInvoiceReplyDiscount = {
      type: 'PERCENT_OFF',
      name: 'Preview for instance usage',
      amount: '5432',
    };

    expect(transform(stripeInvoice, [], [discount])).toHaveProperty('totalWithoutDiscount', 123);

    expect(transform(stripeInvoice, [], [discount])).toHaveProperty<InvoiceDiscount[]>('discounts', [
      {
        type: 'percentOff',
        label: 'Preview for instance usage',
        value: 0.5432,
      },
    ]);
  });
});
