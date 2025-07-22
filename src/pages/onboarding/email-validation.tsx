import { useMutation } from '@tanstack/react-query';

import { useLogoutMutation, useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { IconSend } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from '../authentication/components/auth-button';

import Background from './images/email-validation.svg?react';

const T = createTranslate('pages.onboarding.emailValidation');

export function EmailValidation() {
  const user = useUser();
  const t = T.useTranslate();

  const resendMutation = useMutation({
    ...useApiMutationFn('resendValidationEmail', {}),
    onSuccess() {
      notify.success(t('resendEmailSuccessNotification', { email: user.email }));
    },
  });

  const logoutMutation = useLogoutMutation('/auth/signup');

  return (
    <section className="col w-full max-w-md flex-1 items-center justify-center gap-12">
      <Background className="absolute bottom-0" />

      <div className="col gap-6 text-center">
        <h1 className="text-3xl font-semibold">
          <T id="title" />
        </h1>

        <p className="text-base text-dim">
          <T
            id="line1"
            values={{
              email: user.email,
              strong: (children) => <strong className="text-default">{children}</strong>,
            }}
          />
        </p>

        <p className="text-base text-dim">
          <T id="line2" />
        </p>
      </div>

      <AuthButton onClick={() => resendMutation.mutate()}>
        <IconSend className="size-4" />
        <T id="resendValidationEmail" />
      </AuthButton>

      <p className="text-dim">
        <T
          id="wrongEmail"
          values={{
            logout: (children) => (
              <button
                type="button"
                onClick={() => logoutMutation.mutate()}
                className="text-default underline"
              >
                {children}
              </button>
            ),
          }}
        />
      </p>
    </section>
  );
}
