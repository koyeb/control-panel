import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { InputEnd, InputStart, Spinner } from '@koyeb/design-system';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { Address, OrganizationPlan } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { StripeProvider } from 'src/application/stripe';
import { ControlledAddressField } from 'src/components/address-field/address-field';
import { ControlledInput } from 'src/components/controlled';
import { IconArrowLeftRight } from 'src/components/icons';
import { PaymentFormFields, PaymentMethodTimeout } from 'src/components/payment-form';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { usePaymentMethodMutation } from 'src/hooks/stripe';
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
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();

  const invalidate = useInvalidateApiQuery();

  const form = useForm<{ address: Address; billingAlertAmount: number }>({
    defaultValues: {
      address: organization.billing.address ?? {
        line1: '',
        postalCode: '',
        city: '',
        country: '',
      },
      billingAlertAmount: 20,
    },
  });

  const billingInfoMutation = useMutation({
    ...useApiMutationFn('updateOrganization', (address: Address) => ({
      path: { id: organization.id },
      query: {},
      body: {
        address1: address.line1,
        address2: address.line2,
        city: address.city,
        postal_code: address.postalCode,
        state: address.state,
        country: address.country,
        billing_name: organization.billing.name === undefined ? user.name : undefined,
        billing_email: organization.billing.email === undefined ? user.email : undefined,
      },
    })),
    onError: useFormErrorHandler(form, (error) => ({
      'address.line1': error.address1,
      'address.line2': error.address2,
      'address.city': error.city,
      'address.postalCode': error.postal_code,
      'address.state': error.state,
      'address.country': error.country,
    })),
  });

  const changePlanMutation = useMutation({
    ...useApiMutationFn('changePlan', (plan: OrganizationPlan) => ({
      path: { id: organization.id },
      body: { plan },
    })),
  });

  const updateBudgetMutation = useMutation({
    ...useApiMutationFn('updateBudget', (amount: number) => ({
      path: { organization_id: organization.id },
      body: { amount: String(100 * amount) },
    })),
  });

  const paymentMethodMutation = usePaymentMethodMutation({
    onTimeout: () => notify.error(<PaymentMethodTimeout />),
  });

  const onSubmit = async ({ address, billingAlertAmount }: FormValues<typeof form>) => {
    await billingInfoMutation.mutateAsync(address);
    await paymentMethodMutation.mutateAsync();
    await changePlanMutation.mutateAsync('starter');

    if (!Number.isNaN(billingAlertAmount)) {
      await updateBudgetMutation.mutateAsync(billingAlertAmount);
    }

    await invalidate('getCurrentOrganization');
  };

  return (
    <form onSubmit={handleSubmit(form, onSubmit)} className="col gap-8">
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
          <PaymentFormFields />

          <ControlledAddressField
            control={form.control}
            name="address"
            required
            size={3}
            label={<T id="creditCard.addressLabel" />}
            placeholder={t('creditCard.addressPlaceholder')}
          />

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

      <AuthButton type="submit" className="self-start">
        {form.formState.isSubmitting && <Spinner className="size-4" />}
        <T id="submit" />
      </AuthButton>
    </form>
  );
}
