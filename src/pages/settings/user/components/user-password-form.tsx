import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { apiMutation, useUser } from 'src/api';
import { useAuthKit } from 'src/application/authkit';
import { notify } from 'src/application/notify';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.general.password');

export function UserPasswordForm() {
  const t = T.useTranslate();
  const user = useUser();
  const form = useForm();
  const authKit = useAuthKit();

  const mutation = useMutation({
    ...apiMutation('post /v1/account/reset_password', {
      body: { email: user?.email },
    }),
    async onSuccess() {
      notify.success(t('successNotification'));
    },
  });

  if (authKit.user) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit(form, () => mutation.mutateAsync())} className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <div>
          <div className="mb-2 font-medium">
            <T id="label" />
          </div>
          <p className="text-dim">
            <T id="description" />
          </p>
        </div>

        <Button type="submit" loading={form.formState.isSubmitting} disabled={form.formState.isSubmitted}>
          <T id="changePassword" />
        </Button>
      </div>

      <footer>
        <p className="text-xs text-dim">
          <T id="footer" />
        </p>
      </footer>
    </form>
  );
}
