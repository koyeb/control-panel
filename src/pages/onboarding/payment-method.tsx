import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { PaymentForm } from 'src/components/payment-form';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('onboarding.paymentMethod');

export function PaymentMethod() {
  const user = useUser();

  return (
    <section className="col gap-4">
      <h1 className="typo-heading my-4 text-center">
        <T id="title" />
      </h1>

      <div className="text-dim">
        <T id="line1" values={{ email: user.email }} />
      </div>

      <PaymentForm
        theme="dark"
        plan="starter"
        renderFooter={(formState) => (
          <Button type="submit" loading={formState.isSubmitting} className="self-start !text-black">
            <T id="submit" />
          </Button>
        )}
      />
    </section>
  );
}
