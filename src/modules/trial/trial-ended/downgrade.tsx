import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useSwitchOrganization } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/forms';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';
import { isSlug } from 'src/utils/strings';

const T = createTranslate('modules.trial.ended.downgrade');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(64)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

export function Downgrade({ onCancel }: { onCancel: () => void }) {
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: {
      organizationName: '',
    },
    resolver: zodResolver(schema),
  });

  const switchOrganization = useSwitchOrganization();

  const mutation = useMutation({
    ...apiMutation('post /v1/organizations', ({ organizationName }: FormValues<typeof form>) => ({
      body: { name: organizationName },
    })),

    async onSuccess({ organization }) {
      await switchOrganization.mutateAsync(organization!.id!);
      notify.success(t('successNotification'));
    },
    onError: useFormErrorHandler(form, (error) => ({
      organizationName: error.name,
    })),
  });

  return (
    <>
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <Alert variant="warning" title={<T id="dataLossWarning" />} description={false} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-8">
        <ControlledInput
          control={form.control}
          name="organizationName"
          placeholder={t('organizationNamePlaceholder')}
          className="max-w-md"
        />

        <DialogFooter>
          <p className="flex-1 text-dim">
            <T
              id="footer.message"
              values={{
                delete: (children) => (
                  <Link to="/" search={{ settings: 'true' }} className="underline">
                    {children}
                  </Link>
                ),
              }}
            />
          </p>

          <Button variant="outline" color="gray" onClick={onCancel}>
            <T id="footer.cancel" />
          </Button>

          <Button
            type="submit"
            color="gray"
            disabled={form.formState.isSubmitted && !form.formState.isValid}
            loading={form.formState.isSubmitting}
          >
            <T id="footer.submit" />
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}
