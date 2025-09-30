import { Elements } from '@stripe/react-stripe-js';
import { Stripe, loadStripe } from '@stripe/stripe-js';
import { useMemo } from 'react';
import { z } from 'zod';

import { getConfig } from './config';
import { notify } from './notify';
import { reportError } from './sentry';
import { createValidationGuard } from './validation';

let retry = 0;

export function StripeProvider({ children }: { children: React.ReactNode }) {
  const stripePromise = useMemo(async function loadStripeFn(): Promise<Stripe | null> {
    const stripePublicKey = getConfig('stripePublicKey');

    if (stripePublicKey === undefined) {
      return null;
    }

    try {
      return await loadStripe(stripePublicKey);
    } catch (error) {
      if (!isFailedToLoadStripeError(error)) {
        throw error;
      }

      if (++retry < 10) {
        await new Promise((r) => setTimeout(r, 1000));
        return loadStripeFn();
      } else {
        reportError(error);
        notify.error(error.message);
      }

      return null;
    }
  }, []);

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

const isFailedToLoadStripeError = createValidationGuard(
  z.object({ message: z.literal('Failed to load Stripe.js') }),
);
