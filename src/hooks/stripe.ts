import { CardNumberElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { StripeError as BaseStripeError, Stripe, StripeElements } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';

import { api } from 'src/api/api';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { getToken } from 'src/application/token';
import { inArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { wait } from 'src/utils/promises';

const waitForPaymentMethodTimeout = 12 * 1000;

class StripeError extends Error {
  constructor(public readonly error: BaseStripeError) {
    super(error.message);
  }
}

class TimeoutError extends Error {}

type PaymentMutationProps = {
  onSuccess?: () => unknown;
  onTimeout?: () => unknown;
};

export function usePaymentMethodMutation({ onSuccess, onTimeout }: PaymentMutationProps = {}) {
  const stripe = useStripe();
  const elements = useElements();

  return useMutation({
    async mutationFn() {
      assert(stripe !== null);
      assert(elements !== null);

      await submitPaymentMethod(stripe, elements);
      await waitForPaymentMethod();
    },
    onError(error) {
      if (error instanceof StripeError) {
        notify.error(error.message);

        if (!inArray(error.error.type, ['validation_error', 'card_error'])) {
          reportError(error, { type: error.error.type, code: error.error.code });
        }
      } else if (error instanceof TimeoutError) {
        onTimeout?.();
      } else {
        throw error;
      }
    },
    onSuccess,
  });
}

async function submitPaymentMethod(stripe: Stripe, elements: StripeElements) {
  const token = getToken();
  const { payment_method } = await api.createPaymentAuthorization({ token });

  try {
    const card = elements.getElement(CardNumberElement);
    assert(card !== null);

    const result = await stripe.confirmCardPayment(
      payment_method!.authorization_stripe_payment_intent_client_secret!,
      { payment_method: { card } },
    );

    if (result.error) {
      throw new StripeError(result.error);
    }
  } finally {
    await api.confirmPaymentAuthorization({
      token,
      path: { id: payment_method!.id! },
    });
  }
}

async function waitForPaymentMethod() {
  const token = getToken();
  let hasPaymentMethod = false;

  const start = new Date().getTime();
  const elapsed = () => new Date().getTime() - start;

  while (!hasPaymentMethod && elapsed() <= waitForPaymentMethodTimeout) {
    const organization = await api.getCurrentOrganization({ token });

    hasPaymentMethod = Boolean(organization.organization?.has_payment_method);

    await wait(1000);
  }

  if (elapsed() > waitForPaymentMethodTimeout) {
    throw new TimeoutError();
  }
}
