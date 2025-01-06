import { Meta, StoryFn } from '@storybook/react';
import clsx from 'clsx';

import { ApiError } from 'src/api/api-errors';
import type { Api } from 'src/api/api-types';
import { StripeInvoice } from 'src/api/mappers/billing';
import { ApiMock } from 'src/api/mock/mock-api';
import { OrganizationPlan } from 'src/api/model';
import { controls } from 'src/storybook';
import { capitalize } from 'src/utils/strings';

import { EstimatedCosts } from './estimated-costs';

type Args = {
  plan: OrganizationPlan;
  discount: 'none' | 'percent_off' | 'amount_off';
};

export default {
  title: 'Components/EstimatedCosts',
  parameters: {
    mockApi,
    className: clsx('max-w-64'),
  },
  args: {
    plan: 'starter',
    discount: 'none',
  },
  argTypes: {
    plan: controls.inlineRadio<OrganizationPlan>(['hobby', 'starter', 'startup', 'internal']),
    discount: controls.inlineRadio<Args['discount']>(['none', 'amount_off', 'percent_off']),
  },
} satisfies Meta<Args>;

export const estimatedCosts: StoryFn = () => <EstimatedCosts />;

function mockApi(args: Args) {
  const api = new ApiMock();
  const data = api.data;

  data.organization.plan = args.plan;

  const invoice: StripeInvoice = {
    subtotal_excluding_tax: 0,
    total_excluding_tax: 0,
  };

  let lines: Api.NextInvoiceLine[] = [];
  const discounts: Api.NextInvoiceDiscount[] = [];

  if (args.plan !== 'hobby') {
    const nanoUsage = 1800;
    const mediumUsage = 1800;

    lines = [
      {
        amount_excluding_tax: nanoUsage * 60 * 60 * 0.0001,
        period: { end: '2024-10-01T00:00:00.000Z', start: '2024-09-01T00:00:00.000Z' },
        plan_nickname: 'Nano instance',
        price: { unit_amount_decimal: 0.0001 },
        quantity: nanoUsage * 60 * 60,
      },
      {
        amount_excluding_tax: mediumUsage * 60 * 60 * 0.0008,
        period: { end: '2024-10-01T00:00:00.000Z', start: '2024-09-01T00:00:00.000Z' },
        plan_nickname: 'Medium instance',
        price: { unit_amount_decimal: 0.0008 },
        quantity: mediumUsage * 60 * 60,
      },
    ];

    invoice.total_excluding_tax = (nanoUsage * 0.0001 + mediumUsage * 0.0008) * 60 * 60;
  }

  if (args.plan === 'startup') {
    lines.push({
      amount_excluding_tax: 7900,
      period: { end: '2024-11-01T00:00:00.000Z', start: '2024-10-01T00:00:00.000Z' },
      plan_nickname: capitalize(args.plan),
      price: { unit_amount_decimal: 7900 },
      quantity: 1,
    });

    invoice.total_excluding_tax += 7900;
  }

  if (args.discount !== 'none') {
    const discount: Api.NextInvoiceDiscount = {
      type: 'AMOUNT_OFF',
      name: 'Discount name',
      amount: '0',
    };

    if (args.discount === 'amount_off') {
      discount.type = 'AMOUNT_OFF';
      discount.amount = '1000';
      invoice.total_excluding_tax -= 1000;
    }

    if (args.discount === 'percent_off') {
      discount.type = 'PERCENT_OFF';
      discount.amount = '50';
      invoice.total_excluding_tax /= 2;
    }

    discounts.push(discount);
  }

  if (args.plan === 'hobby') {
    api.mockEndpoint('getNextInvoice', () => {
      throw new ApiError({ status: 404, code: '', message: '' });
    });
  } else {
    api.mockEndpoint('getNextInvoice', {
      lines,
      stripe_invoice: invoice as never,
    });
  }
}
