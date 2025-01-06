import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApiMutationFn } from 'src/api/use-api';
import { getConfig } from 'src/application/config';
import { notify } from 'src/application/notify';
import { getCaptcha } from 'src/application/recaptcha';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { IconEye, IconEyeOff } from 'src/components/icons';
import { ExternalLink } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

import { AuthenticateButton } from './authenticate-button';
import { ControlledInput } from './controlled-input';

const T = createTranslate('pages.authentication.signUp');

const schema = z.object({
  name: z.string().min(2).max(128),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export function SignUpForm() {
  const t = T.useTranslate();
  const { setToken } = useToken();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: searchParams.get('name') ?? '',
      email: searchParams.get('email') ?? '',
      password: '',
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
      email: t('emailLabel'),
      password: t('passwordLabel'),
    }),
  });

  const { mutateAsync: signUp } = useMutation({
    ...useApiMutationFn('signUp', async (values: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      token: undefined,
      body: {
        email: values.email,
        password: values.password,
        name: values.name,
        captcha: await getCaptcha('signup'),
      },
    })),
    onSuccess(result) {
      setToken(result.token!.id!);
      navigate(routes.home());
    },
    onError: useFormErrorHandler(form, (error) => {
      if ('captcha' in error) {
        notify.error(error.captcha);
      }

      return error;
    }),
  });

  const [passwordVisible, setPasswordVisible] = useState(false);

  useInjectRecaptchaScript();

  return (
    <form onSubmit={handleSubmit(form, signUp)} className="col gap-4">
      <ControlledInput
        control={form.control}
        autoFocus
        name="name"
        type="text"
        required
        placeholder={t('namePlaceholder')}
      />

      <ControlledInput
        control={form.control}
        name="email"
        type="email"
        required
        placeholder={t('emailPlaceholder')}
      />

      <ControlledInput
        control={form.control}
        name="password"
        type={passwordVisible ? 'text' : 'password'}
        autoComplete="current-password"
        required
        placeholder={t('passwordPlaceholder')}
        end={
          <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="mx-6">
            {passwordVisible ? <IconEyeOff className="icon" /> : <IconEye className="icon" />}
          </button>
        }
      />

      <AuthenticateButton loading={form.formState.isSubmitting}>
        <T id="signUp" />
      </AuthenticateButton>

      <p className="text-center text-xs text-dim">
        <T
          id="reCAPTCHA"
          values={{
            privacy: (children) => (
              <ExternalLink href="https://policies.google.com/privacy" className="underline">
                {children}
              </ExternalLink>
            ),
            terms: (children) => (
              <ExternalLink href="https://policies.google.com/terms" className="underline">
                {children}
              </ExternalLink>
            ),
          }}
        />
      </p>
    </form>
  );
}

function useInjectRecaptchaScript() {
  const { recaptchaClientKey } = getConfig();

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
