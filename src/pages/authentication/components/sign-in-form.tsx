import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError } from 'src/api/api-errors';
import { useApiMutationFn } from 'src/api/use-api';
import { useAuth } from 'src/application/authentication';
import { notify } from 'src/application/notify';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from './auth-button';
import { AuthInput } from './auth-input';

const T = createTranslate('pages.authentication.signIn');

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const invalidCredentialApiMessage =
  'There is no Koyeb account associated with this email address or your password is incorrect';

export function SignInForm() {
  const t = T.useTranslate();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const next = useSearchParams().get('next');

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: useZodResolver(schema),
  });

  const { mutateAsync: signIn } = useMutation({
    ...useApiMutationFn('signIn', async (credential: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      token: undefined,
      body: credential,
    })),
    async onSuccess(result) {
      setToken(result.token!.id!);
      navigate({ to: next ?? '/' });
    },
    onError(error) {
      if (ApiError.is(error) && error.message === invalidCredentialApiMessage) {
        form.setError('root', { message: 'invalidCredential' });
      } else {
        notify.error(error.message);
      }
    },
  });

  useEffect(() => {
    const { unsubscribe } = form.watch((values, { type }) => {
      if (type === 'change') {
        form.clearErrors('root');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  return (
    <form onSubmit={handleSubmit(form, signIn)} className="col gap-6">
      <AuthInput
        control={form.control}
        name="email"
        autoFocus
        type="email"
        required
        placeholder={t('emailPlaceholder')}
      />

      <AuthInput
        control={form.control}
        name="password"
        autoComplete="current-password"
        type="password"
        required
        placeholder={t('passwordPlaceholder')}
      />

      {form.formState.errors.root?.message === 'invalidCredential' && (
        <div className="text-red">
          <T id="invalidCredential" />
        </div>
      )}

      <AuthButton
        type="submit"
        disabled={form.formState.submitCount > 0 && !form.formState.isValid}
        loading={form.formState.isSubmitting}
      >
        <T id="submit" />
      </AuthButton>
    </form>
  );
}
