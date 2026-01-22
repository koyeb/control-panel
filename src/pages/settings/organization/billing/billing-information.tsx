import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { addressSchema, apiMutation, useInvalidateApiQuery, useOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { AddressField } from 'src/components/address-field/address-field';
import { ControlledInput } from 'src/components/forms';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { IconSquareArrowOutUpRight } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.billingInformation');

export function BillingInformation() {
  const organization = useOrganization();

  if (!organization?.currentSubscriptionId) {
    return null;
  }

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />
      <BillingInformationForm key={organization.id} />
    </section>
  );
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  vatNumber: z.string(),
  address: addressSchema,
});

function BillingInformationForm() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: organization?.billing.name ?? '',
      email: organization?.billing.email ?? '',
      vatNumber: organization?.billing.vatNumber ?? '',
      address: organization?.billing.address ?? {},
    },
    resolver: zodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('patch /v1/organizations/{id}', ({ address }: FormValues<typeof form>) => ({
      path: { id: organization!.id },
      query: {},
      body: {
        address1: address.line1,
        address2: address.line2,
        city: address.city,
        postal_code: address.postalCode,
        state: address.state,
        country: address.country,
      },
    })),
    async onSuccess(_, values) {
      await invalidate('get /v1/account/organization');
      form.reset(values);
      notify.success(t('successNotification'));
    },
    onError: useFormErrorHandler(form, (error) => ({
      'address.line1': error.address1,
      'address.line2': error.address2,
      'address.city': error.city,
      'address.postalCode': error.postal_code,
      'address.state': error.state,
      'address.country': error.country,
    })),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col max-w-lg gap-4">
      <ControlledInput control={form.control} name="name" label={<T id="nameLabel" />} disabled />

      <ControlledInput
        control={form.control}
        name="email"
        type="email"
        label={<T id="emailLabel" />}
        disabled
      />

      <ControlledInput control={form.control} name="vatNumber" label={<T id="vatNumberLabel" />} disabled />

      <p className="text-dim">
        <BillingPortalInfo />
      </p>

      <Controller
        control={form.control}
        name="address"
        render={({ field, fieldState }) => (
          <AddressField {...field} label={<T id="addressLabel" />} errors={fieldState.error} />
        )}
      />

      <footer className="row gap-2">
        <Button type="reset" color="gray" disabled={!form.formState.isDirty} onClick={() => form.reset()}>
          <Translate id="common.cancel" />
        </Button>

        <Button type="submit" disabled={!form.formState.isDirty} loading={form.formState.isSubmitting}>
          <Translate id="common.save" />
        </Button>
      </footer>
    </form>
  );
}

function BillingPortalInfo() {
  const mutation = useMutation({
    ...apiMutation('get /v1/billing/manage', {}),
    onSuccess({ url }) {
      window.open(url, '_blank');
    },
  });

  const Icon = mutation.isPending ? Spinner : IconSquareArrowOutUpRight;

  return (
    <T
      id="billingPortal"
      values={{
        link: (children) => (
          <button type="button" onClick={() => mutation.mutate()} className="text-link">
            {children}
            <Icon className="ms-1 inline-block size-em" />
          </button>
        ),
      }}
    />
  );
}
