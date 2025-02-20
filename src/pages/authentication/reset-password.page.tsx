import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

import { AuthInput } from './components/auth-input';
import { AuthenticateButton } from './components/authenticate-button';

const T = createTranslate('pages.authentication.resetPassword');

export function ResetPasswordPage() {
  return (
    <div className="col gap-8">
      <h1 className="text-center text-3xl font-semibold">
        <T id="title" />
      </h1>

      <p className="text-center text-dim">
        <T id="description" />
      </p>

      <ResetPasswordForm />

      <Links />
    </div>
  );
}

const schema = z.object({
  email: z.string().email(),
});

export function ResetPasswordForm() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: useZodResolver(schema, {
      email: t('emailLabel'),
    }),
  });

  const mutation = useMutation({
    ...useApiMutationFn('resetPassword', ({ email }: FormValues<typeof form>) => ({
      body: { email },
    })),
    onSuccess() {
      notify.success(t('successNotification'));
      navigate(routes.signIn());
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
      <AuthInput
        control={form.control}
        autoFocus
        name="email"
        type="email"
        required
        placeholder={t('emailPlaceholder')}
      />

      <AuthenticateButton loading={form.formState.isSubmitting}>
        <T id="resetPassword" />
      </AuthenticateButton>
    </form>
  );
}

function Links() {
  const signIn = (children: React.ReactNode[]) => (
    <Link href={routes.signIn()} className="text-link">
      {children}
    </Link>
  );

  const signUp = (children: React.ReactNode[]) => (
    <Link href={routes.signUp()} className="text-link">
      {children}
    </Link>
  );

  return (
    <div className="col gap-4 text-center text-xs">
      <p className="text-dim">
        <T id="signInLink" values={{ link: signIn }} />
      </p>

      <p className="text-dim">
        <T id="signUpLink" values={{ link: signUp }} />
      </p>
    </div>
  );
}
