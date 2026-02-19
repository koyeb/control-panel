import { Badge, InputEnd, InputStart, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, UseFormReturn, useForm } from 'react-hook-form';
import { FormattedNumber } from 'react-intl';

import { ApiError, apiMutation, useInvalidateApiQuery, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { StripeProvider } from 'src/application/stripe';
import { AddressField } from 'src/components/address-field/address-field';
import { AuthButton } from 'src/components/auth-button';
import { ControlledInput } from 'src/components/forms';
import { ExternalLink } from 'src/components/link';
import { PaymentFormFields, PaymentMethodTimeout } from 'src/components/payment-form';
import { PlanIcon } from 'src/components/plan-icon';
import { InfoTooltip } from 'src/components/tooltip';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { usePaymentMethodMutation } from 'src/hooks/stripe';
import { useDebouncedCallback } from 'src/hooks/timers';
import { IconCheck, IconCircleDollarSign, IconPlus, IconTag, IconX } from 'src/icons';
import { FormattedPrice } from 'src/intl/formatted';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';
import { Address, OrganizationPlan } from 'src/model';

const planId: OrganizationPlan = 'pro';
const planPrice = 30 * 100;
const includedCredits = 10 * 100;

const T = createTranslate('pages.onboarding.paymentMethod');

type Coupon = {
  code: string;
  label: string;
  amountOff?: number;
  percentOff?: number;
};

export function PaymentMethod() {
  return (
    <OnboardingLayout className="max-w-4xl max-md:my-8">
      <div className="mb-6 col gap-4">
        <h1 className="text-4xl font-medium">
          <T id="title" />
        </h1>
        <div className="text-base text-dim">
          <T id="description" />
        </div>
      </div>

      <div className="col items-stretch gap-10 md:row">
        <PlanInfo />

        <StripeProvider>
          <Form />
        </StripeProvider>
      </div>
    </OnboardingLayout>
  );
}

function PlanInfo() {
  return (
    <div className="col grow gap-4 rounded-md bg-neutral p-6 shadow-lg md:max-w-86">
      <div className="row items-center gap-3">
        <PlanIcon plan={planId} className="size-8 text-green" />
        <Badge color="green">
          <T id="planInfo.plan" values={{ plan: <TranslateEnum enum="plans" value={planId} /> }} />
        </Badge>
      </div>

      <div className="col gap-3">
        <div className="text-base font-medium">
          <T id="planInfo.title" />
        </div>
        <div className="text-dim">
          <T id="planInfo.description" />
        </div>
      </div>

      <div className="row items-center justify-between gap-3 rounded-md border border-green bg-green/5 px-4 py-3 text-sm/1">
        <div className="row items-center gap-2">
          <div>
            <IconCircleDollarSign className="size-4 text-green" />
          </div>
          <div>
            <T id="planInfo.includedCredit" />
          </div>

          <InfoTooltip content={<T id="planInfo.includedCreditTooltip" />} />
        </div>

        <div className="text-green">
          <FormattedPrice value={includedCredits} digits={0} />
        </div>
      </div>

      <div className="col gap-3">
        <PlanInfoFeature feature={<T id="planInfo.features.feature1" />} />
        <PlanInfoFeature feature={<T id="planInfo.features.feature2" />} />
        <PlanInfoFeature feature={<T id="planInfo.features.feature3" />} />
        <PlanInfoFeature feature={<T id="planInfo.features.feature4" />} />
        <PlanInfoFeature feature={<T id="planInfo.features.feature5" />} />
        <PlanInfoFeature feature={<T id="planInfo.features.feature6" />} />
      </div>
    </div>
  );
}

function PlanInfoFeature({ feature }: { feature: React.ReactNode }) {
  return (
    <div className="row gap-2">
      <div>
        <IconCheck className="size-6 text-green" />
      </div>
      <div className="text-base font-medium text-dim">{feature}</div>
    </div>
  );
}

type FormType = {
  address: Address;
  billingAlertAmount: number;
  couponCode: string;
};

function Form() {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();

  const invalidate = useInvalidateApiQuery();

  const form = useForm<FormType>({
    defaultValues: {
      address: organization?.billing.address ?? {
        line1: '',
        postalCode: '',
        city: '',
        country: '',
      },
      billingAlertAmount: 20,
      couponCode: '',
    },
  });

  const billingInfoMutation = useMutation({
    ...apiMutation('patch /v1/organizations/{id}', (address: Address) => ({
      path: { id: organization!.id },
      query: {},
      body: {
        address1: address.line1,
        address2: address.line2,
        city: address.city,
        postal_code: address.postalCode,
        state: address.state,
        country: address.country,
        billing_name: organization?.billing.name === undefined ? user?.name : undefined,
        billing_email: organization?.billing.email === undefined ? user?.email : undefined,
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
    ...apiMutation(
      'post /v1/organizations/{id}/plan',
      ({ plan, couponCode }: { plan: OrganizationPlan; couponCode?: string }) => ({
        path: { id: organization!.id },
        body: { plan, coupon_code: couponCode },
      }),
    ),
  });

  const updateBudgetMutation = useMutation({
    ...apiMutation('put /v1/organizations/{organization_id}/budget', (amount: number) => ({
      path: { organization_id: organization!.id },
      body: { amount: String(100 * amount) },
    })),
  });

  const paymentMethodMutation = usePaymentMethodMutation({
    onTimeout: () => notify.error(<PaymentMethodTimeout />),
  });

  const [couponCode, setCouponCode] = useState<Coupon | null>(null);

  const getTotal = () => {
    if (couponCode?.amountOff) {
      return Math.max(planPrice - couponCode.amountOff, 0);
    }

    if (couponCode?.percentOff) {
      return Math.max(planPrice * (1 - couponCode.percentOff / 100), 0);
    }

    return planPrice;
  };

  const onSubmit = async ({ address, billingAlertAmount }: FormValues<typeof form>) => {
    await billingInfoMutation.mutateAsync(address);
    await paymentMethodMutation.mutateAsync();
    await changePlanMutation.mutateAsync({ plan: planId, couponCode: couponCode?.code });

    if (!Number.isNaN(billingAlertAmount)) {
      await updateBudgetMutation.mutateAsync(billingAlertAmount);
    }

    await invalidate('get /v1/account/organization');
  };

  return (
    <form onSubmit={handleSubmit(form, onSubmit)} className="col flex-1 gap-8">
      <section className="col gap-4">
        <h2 className="text-xl font-bold">
          <T id="creditCard.title" />
        </h2>

        <div className="col gap-4">
          <PaymentFormFields />

          <Controller
            control={form.control}
            name="address"
            render={({ field, fieldState }) => (
              <AddressField
                {...field}
                required
                size={3}
                label={<T id="creditCard.addressLabel" />}
                placeholder={t('creditCard.addressPlaceholder')}
                errors={fieldState.error}
              />
            )}
          />

          <div className="row justify-between gap-4">
            <div className="col gap-0.5">
              <label>
                <T id="creditCard.billingAlert.label" />
              </label>
              <div className="text-xs text-dim">
                <T id="creditCard.billingAlert.description" />
              </div>
            </div>

            <ControlledInput
              control={form.control}
              name="billingAlertAmount"
              start={
                <InputStart className="text-xs">
                  <T id="creditCard.billingAlert.inputStart" />
                </InputStart>
              }
              end={
                <InputEnd className="text-xs">
                  <T id="creditCard.billingAlert.inputEnd" />
                </InputEnd>
              }
              className="max-w-40"
            />
          </div>
        </div>
      </section>

      <section className="col gap-3">
        <h2 className="font-bold">
          <T id="recap.title" />
        </h2>

        <div className="divide-y">
          <div className="row justify-between py-2">
            <Coupon form={form} couponCode={couponCode} setCouponCode={setCouponCode} />
            {couponCode && (
              <div className="text-green">
                {couponCode.amountOff && <FormattedPrice value={-couponCode.amountOff} />}
                {couponCode.percentOff && (
                  <FormattedNumber value={-couponCode.percentOff / 100} style="percent" />
                )}
              </div>
            )}
          </div>

          <div className="row justify-between py-2">
            <div>
              <T id="recap.plan" values={{ plan: <TranslateEnum enum="plans" value={planId} /> }} />
            </div>
            <div>
              <FormattedPrice value={planPrice} digits={0} />
            </div>
          </div>

          <div className="row justify-between py-2">
            <div className="font-medium">
              <T id="recap.total" />
            </div>
            <div className="font-medium">
              <FormattedPrice value={getTotal()} />
            </div>
          </div>
        </div>
      </section>

      <footer className="col gap-3">
        <AuthButton type="submit" className="py-3">
          {form.formState.isSubmitting && <Spinner className="size-4" />}
          <T id="submit" />
        </AuthButton>

        <p className="text-center text-xs text-dim">
          <T
            id="chargeMessage"
            values={{
              link: (children) => (
                <ExternalLink href="https://koyeb.com/pricing" openInNewTab>
                  {children}
                </ExternalLink>
              ),
            }}
          />
        </p>
      </footer>
    </form>
  );
}

type CouponCodeProps = {
  form: UseFormReturn<FormType>;
  couponCode: Coupon | null;
  setCouponCode: (couponCode: Coupon | null) => void;
};

function Coupon({ form, couponCode, setCouponCode }: CouponCodeProps) {
  const t = T.useTranslate();
  const [show, setShow] = useState(false);

  const mutation = useMutation({
    ...apiMutation('get /v1/coupons/{code}', (code: string) => ({
      path: { code },
    })),
    onSuccess(result, code) {
      setCouponCode({
        code,
        label: result.name!,
        percentOff: result.percent_off,
        amountOff: result.amount_off ? Number(result.amount_off) : undefined,
      });

      form.resetField('couponCode');
      setShow(false);
    },
    onError: (error) => {
      if (ApiError.is(error)) {
        form.setError('couponCode', { message: error.message });
      } else {
        notify.error(error.message);
      }
    },
  });

  const [mutateDebounce, { isDebouncing }] = useDebouncedCallback(mutation.mutate, 10_00);

  if (couponCode) {
    return (
      <div className="inline-flex flex-col items-start gap-0.5">
        <div className="inline-flex flex-row items-center gap-1 rounded-md bg-neutral px-2 py-1">
          <div>
            <IconTag className="size-4" />
          </div>

          <div className="text-xs font-medium">{couponCode.code}</div>

          <button type="button" onClick={() => setCouponCode(null)}>
            <IconX className="size-4" />
          </button>
        </div>

        <div className="px-3 text-xs text-dim">{couponCode.label}</div>
      </div>
    );
  }

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        className="row items-center gap-2 text-xs text-green"
      >
        <IconPlus className="size-4" />
        <T id="recap.couponCode.add" />
      </button>
    );
  }

  const submitCode = (code: string) => {
    form.clearErrors('couponCode');

    if (code !== '') {
      mutateDebounce(code);
    }
  };

  const hideInput = () => {
    form.resetField('couponCode');
    setShow(false);
  };

  return (
    <ControlledInput
      control={form.control}
      name="couponCode"
      autoFocus
      onChangeEffect={(event) => submitCode(event.target.value)}
      placeholder={t('recap.couponCode.placeholder')}
      end={
        <InputEnd background={false}>
          {isDebouncing || mutation.isPending ? (
            <Spinner className="size-4" />
          ) : (
            <button type="button" onClick={hideInput}>
              <IconX className="size-4" />
            </button>
          )}
        </InputEnd>
      }
      className="max-w-64"
    />
  );
}
