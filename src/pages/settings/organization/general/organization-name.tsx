import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.general.organizationName');

const schema = z.object({
  organizationName: z.string().min(1),
});

export function OrganizationName() {
  const organization = useOrganization();

  const form = useForm<z.infer<typeof schema>>({
    resolver: useZodResolver(schema),
  });

  useEffect(() => {
    form.reset({ organizationName: organization.name });
  }, [form, organization]);

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('updateOrganization', ({ organizationName }: FormValues<typeof form>) => ({
      query: {},
      path: { id: organization.id },
      body: { name: organizationName },
    })),
    onSuccess(_, values) {
      void invalidate('getCurrentOrganization');
      form.reset(values);
      notify.success("Your organization's name was updated");
    },
    onError: useFormErrorHandler(form, (error) => ({ organizationName: error.name })),
  });

  return (
    <section className="col items-start gap-4 sm:row sm:gap-8">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="row gap-4">
        <ControlledInput control={form.control} name="organizationName" />

        <footer className="row gap-2">
          <Button type="submit" disabled={!form.formState.isDirty} loading={form.formState.isSubmitting}>
            <Translate id="common.save" />
          </Button>
        </footer>
      </form>
    </section>
  );
}
