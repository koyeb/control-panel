import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { DocumentTitle } from 'src/components/document-title';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useRouteParam } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';
import { AuthenticationLayout } from 'src/layouts/authentication/authentication.layout';

import { AuthButton } from '../authentication/components/auth-button';
import { AuthInput } from '../authentication/components/auth-input';

const T = createTranslate('pages.account.changePassword');

export function ChangePasswordPage() {
  const t = T.useTranslate();

  return (
    <AuthenticationLayout slides={false}>
      <DocumentTitle title={t('title')} />

      <div className="col mx-auto w-full max-w-72 flex-1 justify-center py-8 text-center">
        <h1 className="text-3xl font-semibold">
          <T id="title" />
        </h1>

        <ChangePasswordForm />
      </div>
    </AuthenticationLayout>
  );
}

const schema = z.object({
  password: z.string().min(8).max(128),
});

function ChangePasswordForm() {
  const t = T.useTranslate();
  const token = useRouteParam('token');
  const { clearToken } = useToken();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      password: '',
    },
    resolver: useZodResolver(schema),
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
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col mt-12 gap-6">
      <AuthInput
        control={form.control}
        autoFocus
        required
        name="password"
        type="password"
        placeholder={t('passwordPlaceholder')}
      />

      <AuthButton type="submit" loading={form.formState.isSubmitting}>
        <T id="submit" />
      </AuthButton>
    </form>
  );
}
