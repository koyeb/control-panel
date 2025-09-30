import { Alert, Button, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSetToken } from 'src/application/authentication';
import { getApi } from 'src/application/container';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';
import { isSlug } from 'src/utils/strings';

const T = createTranslate('modules.trial.ended.downgrade');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(39)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

export function Downgrade({ onCancel }: { onCancel: () => void }) {
  const t = T.useTranslate();
  const setToken = useSetToken();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      organizationName: '',
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    async mutationFn({ organizationName }: FormValues<typeof form>) {
      const api = getApi();

      const { organization } = await api('post /v1/organizations', {
        body: { name: organizationName },
      });

      const { token: newToken } = await api('post /v1/organizations/{id}/switch', {
        path: { id: organization!.id! },
        header: {},
      });

      return newToken!.id!;
    },
    async onSuccess(token) {
      await setToken(token);
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
