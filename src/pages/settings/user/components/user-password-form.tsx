import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.userSettings.general.password');

export function UserPasswordForm() {
  const t = T.useTranslate();
  const user = useUser();
  const form = useForm();

  const mutation = useMutation({
    ...useApiMutationFn('resetPassword', {
      body: { email: user.email },
    }),
    async onSuccess() {
      notify.success(t('successNotification'));
    },
  });

  return (
    <form onSubmit={handleSubmit(form, () => mutation.mutateAsync())} className="card">
      <div className="col gap-4 p-4">
        <div>
          <T id="label" />
        </div>

        <p>
          <T id="description" />
        </p>
      </div>

      <footer>
        <p className="text-xs text-dim">
          <T id="footer" />
        </p>

        <Button
          type="submit"
          className="self-start"
          loading={form.formState.isSubmitting}
          disabled={form.formState.isSubmitted}
        >
          <T id="changePassword" />
        </Button>
      </footer>
    </form>
  );
}
