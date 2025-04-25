import { InputEnd, InputStart } from '@koyeb/design-system';
import { StripeProvider } from 'src/application/stripe';
import { ControlledInput } from 'src/components/controlled';
import { IconArrowLeftRight } from 'src/components/icons';
import { PaymentFormFields, usePaymentForm } from 'src/components/payment-form';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.paymentMethod');

export function PaymentMethod() {
  return (
    <div className="col flex-1 justify-center gap-8">
      <StripeProvider>
        <Form />
      </StripeProvider>
    </div>
  );
}

function Form() {
  const { form, mutation } = usePaymentForm('starter');

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-8">
      <section className="col gap-8">
        <header className="col gap-1">
          <h1 className="text-3xl font-semibold">
            <T id="creditCard.title" />
          </h1>

          <p className="text-dim">
            <T id="creditCard.description" />
          </p>
        </header>

        <div className="col gap-4">
          <PaymentFormFields form={form} />

          <div className="row items-center gap-3 rounded-md bg-gray/10 px-3 py-2">
            <IconArrowLeftRight className="size-4 text-dim" />

            <p className="text-xs text-dim">
              <T id="creditCard.temporaryHoldMessage" />
            </p>
          </div>
        </div>
      </section>

      <section className="col gap-4">
        <header className="col gap-1">
          <h1 className="text-2xl font-semibold">
            <T id="billingAlert.title" />
          </h1>

          <p className="text-dim">
            <T id="billingAlert.description" />
          </p>
        </header>

        <div className="row items-center gap-2">
          <ControlledInput
            control={form.control}
            name="billingAlertAmount"
            type="number"
            start={
              <InputStart>
                <T id="billingAlert.inputStart" />
              </InputStart>
            }
            end={
              <InputEnd>
                <T id="billingAlert.inputEnd" />
              </InputEnd>
            }
            className="max-w-48"
          />
        </div>
      </section>

      <AuthButton type="submit" loading={form.formState.isSubmitting} className="self-start">
        <T id="submit" />
      </AuthButton>
    </form>
  );
}
