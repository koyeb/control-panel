import { withStopPropagation } from 'src/application/dom-events';
import { StripeProvider } from 'src/application/stripe';
import { IconArrowLeftRight } from 'src/components/icons';
import { usePaymentForm, PaymentFormFields } from 'src/components/payment-form';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.paymentMethod');

export function PaymentMethod() {
  return (
    <div className="col flex-1 justify-center gap-8">
      <section className="col gap-8">
        <header className="col gap-1">
          <h1 className="text-3xl font-semibold">
            <T id="title" />
          </h1>

          <p className="text-dim">
            <T id="description" />
          </p>
        </header>

        <StripeProvider>
          <Form />
        </StripeProvider>
      </section>
    </div>
  );
}

function Form() {
  const { form, mutation } = usePaymentForm('starter');

  return (
    <form onSubmit={withStopPropagation(handleSubmit(form, mutation.mutateAsync))} className="col gap-6">
      <PaymentFormFields form={form} />

      <div className="row items-center gap-3 rounded-md bg-gray/10 px-3 py-2">
        <IconArrowLeftRight className="size-4 text-dim" />

        <p className="text-xs text-dim">
          <T id="temporaryHoldMessage" />
        </p>
      </div>

      <AuthButton type="submit" loading={form.formState.isSubmitting} className="self-start">
        <T id="submit" />
      </AuthButton>
    </form>
  );
}
