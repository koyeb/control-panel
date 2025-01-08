import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert, Button, Dialog2, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, useFormErrorHandler, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';
import { isSlug } from 'src/utils/strings';

const T = createTranslate('modules.trial.ended.downgradeDialog');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(39)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

export function DowngradeDialog({ onCancel }: { onCancel: () => void }) {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const { token, setToken } = useToken();

  const form = useForm({
    defaultValues: {
      organizationName: '',
    },
    resolver: useZodResolver(schema, {
      organizationName: t('organizationNameField.label'),
    }),
  });

  const mutation = useMutation({
    async mutationFn({ organizationName }: FormValues<typeof form>) {
      const { organization } = await api.createOrganization({
        token,
        body: { name: organizationName },
      });

      const { token: newToken } = await api.switchOrganization({
        token,
        path: { id: organization!.id! },
        header: {},
      });

      return newToken!.id!;
    },
    async onSuccess(token) {
      await invalidate('getCurrentOrganization');
      setToken(token);
      notify.success(t('successNotification'));
    },
    onError: useFormErrorHandler(form, (error) => ({
      organizationName: error.name,
    })),
  });

  return (
    <Dialog2 open className="col w-full max-w-4xl gap-8">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <Alert variant="info" title={<T id="dataLossWarning" />} description={false} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-8">
        <ControlledInput
          control={form.control}
          name="organizationName"
          placeholder={t('organizationNameField.placeholder')}
          className="max-w-md"
        />

        <DialogFooter>
          <p className="flex-1 text-dim">
            <T
              id="footer.message"
              values={{
                delete: (children) => (
                  <button type="button" className="underline">
                    {children}
                  </button>
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
    </Dialog2>
  );
}
