import { Button } from '@koyeb/design-system';
import { PaymentForm } from 'src/components/payment-form';
import { Translate } from 'src/intl/translate';
import { FeaturesList } from 'src/layouts/secondary/features-list';

const T = Translate.prefix('onboarding.paymentMethod');

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

        <PaymentForm
          plan="starter"
          renderFooter={(formState) => (
            <Button type="submit" loading={formState.isSubmitting} className="mt-4">
              <T id="submit" />
            </Button>
          )}
        />
      </section>

      <section className="lg:col hidden justify-center">
        <FeaturesList />
      </section>
    </div>
  );
}
