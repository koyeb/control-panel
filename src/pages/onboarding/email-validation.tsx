import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { createTranslate } from 'src/intl/translate';

import { OnboardingStepper } from './stepper';

const T = createTranslate('onboarding.emailValidation');

export function EmailValidation() {
  const user = useUser();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('resendValidationEmail', {}),
    onSuccess() {
      notify.success(t('resendEmailSuccessNotification', { email: user.email }));
    },
  });

  return (
    <section className="col w-full max-w-xl items-start gap-6">
      <OnboardingStepper step={1} />

      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="col max-w-sm gap-4 text-dim">
        <p className="font-medium">
          <T id="line1" values={{ email: user.email, green }} />
        </p>
        <p>
          <T id="line2" />
        </p>
      </div>

      <Button loading={mutation.isPending} onClick={() => mutation.mutate()}>
        <T id="resendValidationEmail" />
      </Button>
    </section>
  );
}

const green = (children: React.ReactNode) => {
  return <span className="text-green">{children}</span>;
};
