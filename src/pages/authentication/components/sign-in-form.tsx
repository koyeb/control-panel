import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { isApiError } from 'src/api/api-errors';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { IconEye, IconEyeOff } from 'src/components/icons';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';

import { AuthenticateButton } from './authenticate-button';
import { ControlledInput } from './controlled-input';

const T = Translate.prefix('pages.authentication.signIn');

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const invalidCredentialApiMessage =
  'There is no Koyeb account associated with this email address or your password is incorrect';

export function SignInForm() {
  const t = T.useTranslate();
  const { setToken } = useToken();
  const navigate = useNavigate();
  const getSeonFingerprint = useSeon();

  const [next] = useSearchParam('next');

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: useZodResolver(schema, {
      email: t('emailLabel'),
      password: t('passwordLabel'),
    }),
  });

  const { mutateAsync: signIn } = useMutation({
    ...useApiMutationFn('signIn', async (credential: FormValues<typeof form>) => ({
      header: { 'seon-fp': await getSeonFingerprint() },
      body: credential,
    })),
    async onSuccess(result) {
      setToken(result.token!.id!);
      navigate(next ?? routes.home());
    },
    onError(error) {
      if (isApiError(error) && error.message === invalidCredentialApiMessage) {
        setInvalidCredential(true);
      } else {
        notify.error(error.message);
      }
    },
  });

  const [invalidCredential, setInvalidCredential] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const { unsubscribe } = form.watch(() => {
      setInvalidCredential(false);
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  return (
    <form onSubmit={handleSubmit(form, signIn)} className="col gap-4">
      {invalidCredential && (
        <div className="rounded-md bg-red p-4 text-black">
          <T id="invalidCredential" />
        </div>
      )}

      <ControlledInput
        control={form.control}
        autoFocus
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
        <T id="signIn" />
      </AuthenticateButton>
    </form>
  );
}
