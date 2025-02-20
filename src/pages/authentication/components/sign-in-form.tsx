import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Spinner } from '@koyeb/design-system';
import { isApiError } from 'src/api/api-errors';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { useSeon } from 'src/hooks/seon';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.authentication.signIn');

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
      token: undefined,
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

  useEffect(() => {
    const { unsubscribe } = form.watch(() => {
      setInvalidCredential(false);
    });

    return () => {
      unsubscribe();
    };
  }, [form]);

  return (
    <form onSubmit={handleSubmit(form, signIn)} className="col gap-6">
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <div className="text-start">
            <input
              autoFocus
              type="email"
              required
              placeholder={t('emailPlaceholder')}
              className="w-full rounded-md border border-[#9F9F9F] bg-white/40 px-3 py-2"
              {...field}
            />
            {fieldState.error?.message && (
              <div className="mt-1 text-xs text-red">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <div className="text-start">
            <input
              autoFocus
              autoComplete="current-password"
              type="password"
              required
              placeholder={t('passwordPlaceholder')}
              className="w-full rounded-md border border-[#9F9F9F] bg-white/40 px-3 py-2"
              {...field}
            />
            {fieldState.error?.message && (
              <div className="mt-1 text-xs text-red">{fieldState.error.message}</div>
            )}
          </div>
        )}
      />

      {invalidCredential && (
        <div className="text-red">
          <T id="invalidCredential" />
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.submitCount > 0 && !form.formState.isValid}
        className="row w-full items-center justify-center gap-2 rounded-md bg-[#1A1917] px-4 py-2 font-medium text-white disabled:bg-[#1A1917]/50"
      >
        {form.formState.isSubmitting ? <Spinner className="size-5" /> : <T id="signIn" />}
      </button>
    </form>
  );
}
