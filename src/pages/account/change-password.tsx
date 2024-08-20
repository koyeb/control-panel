import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

// todo: use main controlled input
import { ControlledInput } from '../authentication/components/controlled-input';

const T = Translate.prefix('pages.account.changePassword');

export function ChangePasswordPage() {
  return (
    <SecondaryLayout>
      <div className="col gap-8">
        <h1 className="text-center text-3xl font-semibold">
          <T id="title" />
        </h1>

        <ChangePasswordForm />
      </div>
    </SecondaryLayout>
  );
}

const schema = z.object({
  password: z.string().min(8).max(128),
});

export function ChangePasswordForm() {
  const t = T.useTranslate();
  const token = useRouteParam('token');
  const { clearToken } = useAccessToken();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      password: '',
    },
    resolver: useZodResolver(schema, {
      password: t('passwordLabel'),
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('updatePassword', async ({ password }: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      body: { id: token, password },
    })),
    onSuccess() {
      notify.success(t('successNotification'));
      clearToken();
      navigate(routes.signIn());
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
      <ControlledInput
        control={form.control}
        autoFocus
        name="password"
        type="password"
        required
        placeholder={t('passwordPlaceholder')}
      />

      <Button type="submit" loading={form.formState.isSubmitting} className="!rounded-full py-3">
        <T id="resetPassword" />
      </Button>
    </form>
  );
}
