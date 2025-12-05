import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { apiMutation, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { IconSend } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { AuthButton } from '../authentication/components/auth-button';

import Background from './images/email-validation.svg?react';

const T = createTranslate('pages.onboarding.emailValidation');

export function EmailValidation() {
  const t = T.useTranslate();

  const navigate = useNavigate();
  const user = useUser();

  const resendMutation = useMutation({
    ...apiMutation('post /v1/account/resend_validation', {}),
    onSuccess() {
      notify.success(t('resendEmailSuccessNotification', { email: user?.email }));
    },
  });

  return (
    <>
      <Background className="absolute bottom-0 hidden w-1/2 opacity-40 sm:block" />

      <section className="z-10 col w-full max-w-md flex-1 items-center justify-center gap-12">
        <div className="col gap-6 text-center">
          <h1 className="text-3xl font-semibold">
            <T id="title" />
          </h1>

          <p className="text-base text-dim">
            <T
              id="line1"
              values={{
                email: user?.email,
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
                  onClick={() => void navigate({ to: '/signout' })}
                  className="text-default underline"
                >
                  {children}
                </button>
              ),
            }}
          />
        </p>
      </section>
    </>
  );
}
