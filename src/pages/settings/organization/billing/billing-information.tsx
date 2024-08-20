import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { addressSchema } from 'src/api/mappers/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { AddressField } from 'src/components/address-field/address-field';
import { ControlledCheckbox, ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.organizationSettings.billing.billingInformation');

export function BillingInformation() {
  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />
      <BillingInformationForm />
    </section>
  );
}

const schema = z.object({
  name: z.string().min(1),
  email: z.string().min(1),
  address: addressSchema,
  company: z.boolean(),
  vatNumber: z.string(),
});

function BillingInformationForm() {
  const user = useUser();
  const organization = useOrganization();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: organization.billing.name ?? user.name,
      email: organization.billing.email ?? user.email,
      address: organization.billing.address ?? {},
      company: organization.billing.company,
      vatNumber: organization.billing.vatNumber ?? '',
    },
    resolver: useZodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn(
      'updateOrganization',
      ({ name, email, address, company, vatNumber }: FormValues<typeof form>) => ({
        path: { id: organization.id },
        query: {},
        body: {
          billing_name: name,
          billing_email: email,
          address1: address.line1,
          address2: address.line2,
          city: address.city,
          postal_code: address.postalCode,
          state: address.state,
          country: address.country,
          company,
          vat_number: vatNumber,
        },
      }),
    ),
    async onSuccess(_, values) {
      await invalidate('getCurrentOrganization');
      form.reset(values);
      notify.success(t('successNotification'));
    },
    onError: useFormErrorHandler(form, (error) => ({
      name: error.billing_name,
      email: error.billing_email,
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
      <ControlledInput control={form.control} name="name" label={<T id="nameLabel" />} />
      <ControlledInput control={form.control} name="email" type="email" label={<T id="emailLabel" />} />

      <Controller
        control={form.control}
        name="address"
        render={({ field }) => (
          <AddressField
            label={<T id="addressLabel" />}
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

      <ControlledCheckbox control={form.control} name="company" label={<T id="companyLabel" />} />

      {form.watch('company') && (
        <ControlledInput control={form.control} name="vatNumber" label={<T id="vatNumberLabel" />} />
      )}

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
