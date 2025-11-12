import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ApiError, apiMutation } from 'src/api';
import { useAuthKit } from 'src/application/authkit';
import { notify } from 'src/application/notify';
import { setToken } from 'src/application/token';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { urlToLinkOptions, useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { createTranslate } from 'src/intl/translate';
import { lowerCase } from 'src/utils/strings';

import { AuthButton } from './auth-button';
import { AuthInput } from './auth-input';

const T = createTranslate('pages.authentication.signIn');

const emailSchema = z.object({
  email: z.email(),
});

const emailPasswordSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
});

const invalidCredentialApiMessages = [
  'There is no Koyeb account associated with this email address or your password is incorrect',
  'Cannot find user',
];

export function SignInForm({ redirect }: { redirect: string }) {
  const t = T.useTranslate();
  const authKit = useAuthKit();

  const [authenticationMethod, setAuthenticationMethod] = useState<'workos' | 'koyeb' | null>(null);

  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const form = useForm<z.infer<typeof emailSchema | typeof emailPasswordSchema>>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(authenticationMethod === 'koyeb' ? emailPasswordSchema : emailSchema),
  });

  const getAuthenticationMethodMutation = useMutation({
    ...apiMutation('get /v1/account/login_method', (email: string) => ({ query: { email } })),
    async onSuccess({ method }, email) {
      setAuthenticationMethod(lowerCase(method!));

      if (method === 'WORKOS') {
        await authKit.signIn({ email, next: redirect });
      }
    },
  });

  const signInMutation = useMutation({
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

  const onSubmit = async (values: FormValues<typeof form>) => {
    if (authenticationMethod === null) {
      await getAuthenticationMethodMutation.mutateAsync(values.email);
    }

    if (authenticationMethod === 'koyeb') {
      await signInMutation.mutateAsync(values);
    }
  };

  const resetPasswordLink = (children: React.ReactNode[]) => (
    <Link to="/auth/reset-password" className="font-medium text-default">
      {children}
    </Link>
  );

  return (
    <form onSubmit={handleSubmit(form, onSubmit)} className="col gap-6">
      <AuthInput
        control={form.control}
        autoFocus
        required
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
        onChangeEffect={() => setAuthenticationMethod(null)}
      />

      <AuthInput
        control={form.control}
        name="password"
        autoComplete="current-password"
        type="password"
        required={authenticationMethod === 'koyeb'}
        placeholder={t('passwordPlaceholder')}
        helperText={
          <div className="text-dim">
            <T id="forgotPasswordLink" values={{ link: resetPasswordLink }} />
          </div>
        }
        classes={{ root: clsx({ hidden: authenticationMethod !== 'koyeb' }) }}
      />

      {form.formState.errors.root?.message === 'invalidCredential' && (
        <div className="text-red">
          <T id="invalidCredential" />
        </div>
      )}

      <AuthButton type="submit" loading={form.formState.isSubmitting || authenticationMethod === 'workos'}>
        <T id={authenticationMethod === null ? 'continue' : 'submit'} />
      </AuthButton>
    </form>
  );
}
