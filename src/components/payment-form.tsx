import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { StripeError as BaseStripeError, Stripe, StripeElements } from '@stripe/stripe-js';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Controller, FormState, useForm } from 'react-hook-form';

import { Button, Field, FieldLabel } from '@koyeb/design-system';
import { api, ApiEndpointParams } from 'src/api/api';
import { useOrganization } from 'src/api/hooks/session';
import { Address, OrganizationPlan } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { withStopPropagation } from 'src/application/dom-events';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/report-error';
import { StripeProvider } from 'src/application/stripe';
import { getToken, useToken } from 'src/application/token';
import { AddressField } from 'src/components/address-field/address-field';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { ThemeMode, useThemeModeOrPreferred } from 'src/hooks/theme';
import { createTranslate, Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { assert } from 'src/utils/assert';
import { wait } from 'src/utils/promises';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from './dialog';

const T = createTranslate('components.upgradeDialog');

const waitForPaymentMethodTimeout = 12 * 1000;

class StripeError extends Error {
  constructor(public readonly error: BaseStripeError) {
    super(error.message);
  }
}

class TimeoutError extends Error {}

const classes = {
  base: clsx('col h-10 w-full justify-center rounded border px-2 -outline-offset-1'),
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
  const organization = useOrganization();

  const form = useForm<{ address: Address }>({
    defaultValues: {
      address: organization.billing.address ?? {
        line1: '',
        postalCode: '',
        city: '',
        country: '',
      },
    },
  });

  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();

  const stripe = useStripe();
  const elements = useElements();

  const handleFormError = useFormErrorHandler(form, (error) => ({
    'address.line1': error.address1,
    'address.line2': error.address2,
    'address.city': error.city,
    'address.postalCode': error.postal_code,
    'address.state': error.state,
    'address.country': error.country,
  }));

  const mutation = useMutation({
    async mutationFn({ address }: FormValues<typeof form>) {
      await updateBillingInformation(address);

      assert(stripe !== null);
      assert(elements !== null);
      await submitPaymentMethod(stripe, elements);

      await waitForPaymentMethod();

      await api.changePlan({
        token,
        path: { id: organization.id },
        body: { plan },
      });
    },
    onError(error) {
      if (error instanceof StripeError) {
        notify.error(error.message);

        if (!inArray(error.error.type, ['validation_error', 'card_error'])) {
          reportError(error, { type: error.error.type, code: error.error.code });
        }
      } else if (error instanceof TimeoutError) {
        notify.error(<PaymentMethodTimeout />);
      } else {
        handleFormError(error);
      }
    },
    async onSuccess() {
      await invalidate('getCurrentOrganization');
      onPlanChanged?.();
    },
  });

  const theme = useThemeModeOrPreferred();
  const style = theme === ThemeMode.light ? stylesLight : stylesDark;

  if (stripe === null) {
    return <T id="loadingStripe" />;
  }

  return (
    <form onSubmit={withStopPropagation(handleSubmit(form, mutation.mutateAsync))} className="col gap-6">
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

        <div className="col-span-2">
          <Controller
            control={form.control}
            name="address"
            render={({ field }) => (
              <AddressField
                required
                size={3}
                label={<T id="addressLabel" />}
                placeholder={t('addressPlaceholder')}
                value={field.value}
                onChange={field.onChange}
                errors={{
                  line1: form.formState.errors.address?.line1?.message,
                  line2: form.formState.errors.address?.line2?.message,
                  city: form.formState.errors.address?.city?.message,
                  postalCode: form.formState.errors.address?.postalCode?.message,
                  state: form.formState.errors.address?.state?.message,
                  country: form.formState.errors.address?.country?.message,
                }}
              />
            )}
          />
        </div>
      </div>

      <p className="text-dim">
        {plan === 'starter' && <T id="temporaryHoldMessage" />}
        {plan !== 'starter' && <T id="proratedChargeMessage" />}
      </p>

      {renderFooter(form.formState)}
    </form>
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

function PaymentMethodTimeout() {
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

async function updateBillingInformation(address: Address) {
  const token = getToken();
  const { user } = await api.getCurrentUser({ token });
  const { organization } = await api.getCurrentOrganization({ token });

  const body: ApiEndpointParams<'updateOrganization'>['body'] = {
    address1: address.line1,
    address2: address.line2,
    city: address.city,
    postal_code: address.postalCode,
    state: address.state,
    country: address.country,
  };

  if (organization?.billing_name === '') {
    body.billing_name = user?.name;
  }

  if (organization?.billing_email === '') {
    body.billing_email = user?.email;
  }

  await api.updateOrganization({
    token,
    path: { id: organization!.id! },
    query: {},
    body,
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
