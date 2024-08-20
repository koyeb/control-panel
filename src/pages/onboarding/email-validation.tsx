import { useMutation } from '@tanstack/react-query';

import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('onboarding.emailValidation');

export function EmailValidation() {
  const user = useUser();
  const t = T.useTranslate();

  const mutation = useMutation({
    ...useApiMutationFn('resendValidationEmail', {}),
    onSuccess() {
      notify.success(t('resendInvitationSuccessNotification', { email: user.email }));
    },
  });

  return (
    <section className="col gap-4 text-center">
      <h1 className="typo-heading">
        <T id="title" />
      </h1>

      <div className="text-xs text-dim">
        <T id="line1" values={{ email: user.email }} />
      </div>

      <div>
        <T id="line2" />
      </div>

      <Button className="self-center" loading={mutation.isPending} onClick={() => mutation.mutate()}>
        <T id="resendValidationEmail" />
      </Button>
    </section>
  );
}
