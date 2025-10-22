import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { addressSchema, apiMutation, useInvalidateApiQuery, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledAddressField } from 'src/components/address-field/address-field';
import { ControlledCheckbox, ControlledInput } from 'src/components/forms';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.billingInformation');

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
      name: organization?.billing.name ?? user?.name ?? '',
      email: organization?.billing.email ?? user?.email ?? '',
      address: organization?.billing.address ?? {},
      company: organization?.billing.company ?? false,
      vatNumber: organization?.billing.vatNumber ?? '',
    },
    resolver: zodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation(
      'patch /v1/organizations/{id}',
      ({ name, email, address, company, vatNumber }: FormValues<typeof form>) => ({
        path: { id: organization!.id },
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
      await invalidate('get /v1/account/organization');
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
      <ControlledAddressField control={form.control} name="address" label={<T id="addressLabel" />} />
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
