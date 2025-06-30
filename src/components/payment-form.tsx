import { Button, Field, FieldLabel, InputEnd, InputStart } from '@koyeb/design-system';
import { CardCvcElement, CardExpiryElement, CardNumberElement, useStripe } from '@stripe/react-stripe-js';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { FormState, useForm } from 'react-hook-form';

import { useOrganization, useUser } from 'src/api/hooks/session';
import { Address, OrganizationPlan } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { withStopPropagation } from 'src/application/dom-events';
import { notify } from 'src/application/notify';
import { StripeProvider } from 'src/application/stripe';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { usePaymentMethodMutation } from 'src/hooks/stripe';
import { ThemeMode, useThemeModeOrPreferred } from 'src/hooks/theme';
import { Translate, createTranslate } from 'src/intl/translate';

import { ControlledAddressField } from './address-field/address-field';
import { ControlledInput } from './controlled';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from './dialog';

const T = createTranslate('components.upgradeDialog');

const classes = {
  base: clsx(
    'col h-10 w-full justify-center rounded border px-2 -outline-offset-1',
    'bg-neutral', // todo: make sure it works with all instances of the payment form
  ),
  focus: clsx('focused'),
};

const stylesLight = {
  base: {
    color: 'rgb(9 9 11)',
    '::placeholder': {
      color: 'rgb(113 113 122)',
    },
  },
};

const stylesDark = {
  base: {
    color: 'rgb(250 250 250)',
    '::placeholder': {
      color: 'rgb(161 161 170)',
    },
  },
};

type PaymentFormProps = {
  plan?: OrganizationPlan;
  onPlanChanged?: () => void;
  renderFooter: (formState: FormState<{ address: Address }>) => React.ReactNode;
};

export function PaymentForm({ plan, onPlanChanged, renderFooter }: PaymentFormProps) {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();

  const invalidate = useInvalidateApiQuery();

  const form = useForm<{ billingAlertAmount: number; address: Address }>({
    defaultValues: {
      billingAlertAmount: 20,
      address: organization.billing.address ?? {
        line1: '',
        postalCode: '',
        city: '',
        country: '',
      },
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
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      onPlanChanged?.();
    },
  });

  const paymentMethodMutation = usePaymentMethodMutation({
    onTimeout: () => notify.error(<PaymentMethodTimeout />),
  });

  const updateBudgetMutation = useMutation({
    ...useApiMutationFn('updateBudget', (amount: number) => ({
      path: { organization_id: organization.id },
      body: { amount: String(100 * amount) },
    })),
  });

  const onSubmit = async ({ billingAlertAmount, address }: FormValues<typeof form>) => {
    await billingInfoMutation.mutateAsync(address);
    await paymentMethodMutation.mutateAsync();
    await changePlanMutation.mutateAsync('starter');

    if (!Number.isNaN(billingAlertAmount)) {
      await updateBudgetMutation.mutateAsync(billingAlertAmount);
    }
  };

  return (
    <form onSubmit={withStopPropagation(handleSubmit(form, onSubmit))} className="col gap-4">
      <PaymentFormFields />

      <ControlledAddressField
        control={form.control}
        name="address"
        required
        size={3}
        label={<T id="addressLabel" />}
        placeholder={t('addressPlaceholder')}
      />

      <p className="text-dim">
        {plan === 'starter' && <T id="temporaryHoldMessage" />}
        {plan !== 'starter' && <T id="proratedChargeMessage" />}
      </p>

      <ControlledInput
        control={form.control}
        name="billingAlertAmount"
        type="number"
        label={<T id="billingAlert.label" />}
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

      <p className="text-dim">
        <T id="billingAlert.description" />
      </p>

      {renderFooter(form.formState)}
    </form>
  );
}

export function PaymentFormFields() {
  const stripe = useStripe();

  const theme = useThemeModeOrPreferred();
  const style = theme === ThemeMode.light ? stylesLight : stylesDark;

  if (stripe === null) {
    return <T id="loadingStripe" />;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <Field className="col-span-2">
        <FieldLabel>
          <T id="cardNumberLabel" />
        </FieldLabel>
        <CardNumberElement options={{ classes, style }} />
      </Field>

      <Field className="flex-1">
        <FieldLabel>
          <T id="expirationLabel" />
        </FieldLabel>
        <CardExpiryElement options={{ classes, style }} />
      </Field>

      <Field className="flex-1">
        <FieldLabel>
          <T id="cvcLabel" />
        </FieldLabel>
        <CardCvcElement options={{ classes, style }} />
      </Field>
    </div>
  );
}

type UpgradeDialogProps = {
  id?: string;
  plan?: OrganizationPlan;
  onPlanChanged?: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  submit: React.ReactNode;
};

export function UpgradeDialog({ id, plan, onPlanChanged, title, description, submit }: UpgradeDialogProps) {
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id={id ?? 'Upgrade'} context={{ plan }} className="col w-full max-w-xl gap-4">
      <DialogHeader title={title} />

      {description && <p className="text-dim">{description}</p>}

      <StripeProvider>
        <PaymentForm
          plan={plan}
          onPlanChanged={() => {
            closeDialog();
            onPlanChanged?.();
          }}
          renderFooter={(formState) => (
            <DialogFooter>
              <CloseDialogButton size={3}>
                <Translate id="common.cancel" />
              </CloseDialogButton>

              <Button type="submit" size={3} loading={formState.isSubmitting}>
                {submit}
              </Button>
            </DialogFooter>
          )}
        />
      </StripeProvider>
    </Dialog>
  );
}

export function PaymentMethodTimeout() {
  return (
    <div className="col gap-1">
      <strong>
        <T id="paymentMethodTimeoutTitle" />
      </strong>

      <p>
        <T
          id="paymentMethodTimeoutDescription"
          values={{
            contactUs: (children) => (
              <span className="intercom-contact-us cursor-pointer underline">{children}</span>
            ),
          }}
        />
      </p>
    </div>
  );
}
