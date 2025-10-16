import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation } from 'src/api';
import { notify } from 'src/application/notify';
import { DocumentTitle } from 'src/components/document-title';
import { Link } from 'src/components/link';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from './components/auth-button';
import { AuthInput } from './components/auth-input';

const T = createTranslate('pages.authentication.resetPassword');

export function ResetPasswordPage() {
  const t = T.useTranslate();

  return (
    <div className="mx-auto col w-full max-w-80 flex-1 justify-center py-8 text-center">
      <DocumentTitle title={t('title')} />

      <h1 className="text-3xl font-semibold">
        <T id="title" />
      </h1>

      <div className="mt-2 font-medium text-default/80">
        <T id="subtitle" />
      </div>

      <ResetPasswordForm />

      <SignInLink />
    </div>
  );
}

const schema = z.object({
  email: z.email(),
});

function ResetPasswordForm() {
  const t = T.useTranslate();
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/account/reset_password', ({ email }: FormValues<typeof form>) => ({
      body: { email },
      token: undefined,
    })),
    async onSuccess() {
      notify.success(t('successNotification'));
      await navigate({ to: '/auth/signin' });
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="mt-12 col gap-6">
      <AuthInput
        control={form.control}
        autoFocus
        name="email"
        type="email"
        required
        placeholder={t('emailPlaceholder')}
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

function SignInLink() {
  const link = (children: React.ReactNode[]) => (
    <Link to="/auth/signin" className="text-default underline">
      {children}
    </Link>
  );

  return (
    <p className="mt-6 text-center text-xs text-dim">
      <T id="signInLink" values={{ link }} />
    </p>
  );
}
