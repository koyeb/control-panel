import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError, apiMutation } from 'src/api';
import { notify } from 'src/application/notify';
import { setToken } from 'src/application/token';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
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

const invalidCredentialApiMessages = [
  'There is no Koyeb account associated with this email address or your password is incorrect',
  'Cannot find user',
];

export function SignInForm({ redirect }: { redirect: string }) {
  const t = T.useTranslate();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: useZodResolver(schema),
  });

  const { mutateAsync: signIn } = useMutation({
    ...apiMutation('post /v1/account/login', async (credential: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      token: null,
      body: credential,
    })),
    async onSuccess({ token }) {
      setToken(token!.id!);
      await navigate(urlToLinkOptions(redirect));
    },
    onError(error) {
      if (ApiError.is(error) && invalidCredentialApiMessages.includes(error.message)) {
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
        autoFocus
        required
        name="email"
        type="email"
        autoComplete="email"
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
