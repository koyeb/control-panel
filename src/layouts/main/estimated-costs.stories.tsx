import { Meta, StoryFn } from '@storybook/react';

import { ApiError } from 'src/api/api-errors';
import { StripeInvoice } from 'src/api/mappers/billing';
import { ApiMock } from 'src/api/mock/mock-api';
import { OrganizationPlan } from 'src/api/model';
import { controls } from 'src/storybook';

import { EstimatedCosts } from './estimated-costs';

type Args = {
  plan: OrganizationPlan;
};

export default {
  title: 'Components/EstimatedCosts',
  parameters: { mockApi },
  args: {
    plan: 'starter',
  },
  argTypes: {
    plan: controls.inlineRadio<OrganizationPlan>(['hobby', 'starter', 'startup', 'enterprise']),
  },
} satisfies Meta<Args>;

export const estimatedCosts: StoryFn = () => <EstimatedCosts />;

function mockApi(args: Args) {
  const api = new ApiMock();
  const data = api.data;

  data.organization.plan = args.plan;

  if (args.plan === 'hobby') {
    api.mockEndpoint('getNextInvoice', () => {
      throw new ApiError({ status: 404, code: '', message: '' });
    });
  } else {
    const invoice: StripeInvoice = {
      lines: { data: [] },
      subtotal_excluding_tax: 0,
      total_excluding_tax: 1234,
    };

    api.mockEndpoint('getNextInvoice', {
      stripe_invoice: invoice as never,
    });
  }
}
