import { Button } from '@koyeb/design-system';
import { StripeProvider } from 'src/application/stripe';
import { PaymentForm } from 'src/components/payment-form';
import { createTranslate } from 'src/intl/translate';
import { FeaturesList } from 'src/layouts/secondary/features-list';

const T = createTranslate('pages.onboarding.paymentMethod');

export function PaymentMethod() {
  return (
    <div className="row w-full justify-evenly">
      <section className="col max-w-md gap-6">
        <div className="mb-4">
          <h1 className="typo-heading mb-1">
            <T id="title" />
          </h1>
          <div className="text-dim">
            <T id="line1" />
          </div>
        </div>

        <StripeProvider>
          <PaymentForm
            plan="starter"
            renderFooter={(formState) => (
              <Button type="submit" loading={formState.isSubmitting} className="mt-4">
                <T id="submit" />
              </Button>
            )}
          />
        </StripeProvider>
      </section>

      <section className="lg:col hidden justify-center">
        <FeaturesList />
      </section>
    </div>
  );
}
