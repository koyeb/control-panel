import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApiMutationFn } from 'src/api/use-api';
import { useSetToken } from 'src/application/authentication';
import { getConfig } from 'src/application/config';
import { notify } from 'src/application/notify';
import { getCaptcha } from 'src/application/recaptcha';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from './auth-button';
import { AuthInput } from './auth-input';

const T = createTranslate('pages.authentication.signUp');

const schema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

type SignUpFormProps = {
  initialValues: {
    name: string | null;
    email: string | null;
  };
};

export function SignUpForm({ initialValues }: SignUpFormProps) {
  const t = T.useTranslate();
  const setToken = useSetToken();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: initialValues.name ?? '',
      email: initialValues.email ?? '',
      password: '',
    },
    resolver: useZodResolver(schema),
  });

  const { mutateAsync: signUp } = useMutation({
    ...useApiMutationFn('signUp', async (values: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      token: null,
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        captcha: await getCaptcha('signup'),
      },
    })),
    async onSuccess({ token }) {
      await setToken(token!.id!);
      await navigate({ to: '/' });
    },
    onError: useFormErrorHandler(form, (error) => {
      if ('captcha' in error) {
        notify.error(error.captcha);
      }

      return error;
    }),
  });

  useInjectRecaptchaScript();

  return (
    <form onSubmit={handleSubmit(form, signUp)} className="col gap-4">
      <AuthInput
        control={form.control}
        required
        autoFocus
        name="name"
        type="text"
        placeholder={t('namePlaceholder')}
      />

      <AuthInput
        control={form.control}
        required
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t('emailPlaceholder')}
      />

      <AuthInput
        control={form.control}
        required
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder={t('passwordPlaceholder')}
      />

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

function useInjectRecaptchaScript() {
  const recaptchaClientKey = getConfig('recaptchaClientKey');

  useEffect(() => {
    if (document.getElementById('recaptcha') !== null) {
      return;
    }

    const script = document.createElement('script');

    script.async = true;
    script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaClientKey}`;
    script.id = 'recaptcha';

    document.body.appendChild(script);
  }, [recaptchaClientKey]);
}
