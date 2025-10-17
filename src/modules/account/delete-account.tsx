import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useOrganization, useUser } from 'src/api';
import { useAuthKit } from 'src/application/authkit';
import { notify } from 'src/application/notify';
import { useIdentifyUser } from 'src/application/posthog';
import { setToken } from 'src/application/token';
import { closeDialog, openDialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { User } from 'src/model';

const T = createTranslate('modules.account.deleteAccount');

export function DeleteAccount() {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();
  const canDelete = organization === undefined;

  const deleteMutation = useDeleteMutation();

  const onDelete = () => {
    openDialog('Confirmation', {
      title: t('confirmation.title'),
      description: t('confirmation.description'),
      confirmationText: user?.name ?? '',
      submitText: t('confirmation.confirm'),
      onConfirm: () => deleteMutation.mutateAsync(user!),
    });
  };

  return (
    <div className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <div>
          <div className="mb-2 font-medium">
            <T id="label" />
          </div>
          <div className="text-dim">
            <T id="description" />
          </div>
        </div>

        <Button color="red" disabled={!canDelete} onClick={onDelete}>
          <T id="delete" />
        </Button>
      </div>

      {!canDelete && (
        <footer>
          <p className="text-xs text-dim">
            <T id="mustLeaveOrganizations" />
          </p>
        </footer>
      )}
    </div>
  );
}

function useDeleteMutation() {
  const t = T.useTranslate();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const authkit = useAuthKit();

  return useMutation({
    ...apiMutation(authkit.user ? 'delete /v2/users/{id}' : 'delete /v1/users/{id}', (user: User) => ({
      path: { id: user.id },
    })),
    async onSuccess() {
      if (authkit.user) {
        authkit.signOut();
      }

      closeDialog();
      clearIdentify();
      setToken(null);

      notify.success(t('success'));
      await navigate({ to: '/auth/signin' });
    },
  });
}
