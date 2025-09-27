import { Button } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiMutation, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { useIdentifyUser } from 'src/application/posthog';
import { setToken } from 'src/application/token';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { Dialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.account.deleteAccount');

export function DeleteAccount() {
  const t = T.useTranslate();
  const openDialog = Dialog.useOpen();

  const user = useUser();
  const organization = useOrganization();
  const canDelete = organization === undefined;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const { mutateAsync: deleteAccount } = useMutation({
    ...apiMutation('delete /v1/users/{id}', {
      path: { id: user?.id as string },
    }),
    async onSuccess() {
      clearIdentify();
      await setToken(null, { queryClient });
      await navigate({ to: '/auth/signin' });
      notify.success(t('successNotification'));
    },
  });

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

        <Button color="red" disabled={!canDelete} onClick={() => openDialog('ConfirmDeleteAccount')}>
          <T id="cta" />
        </Button>
      </div>

      {!canDelete && (
        <footer>
          <p className="text-xs text-dim">
            <T id="mustLeaveOrganizations" />
          </p>
        </footer>
      )}

      <ConfirmationDialog
        id="ConfirmDeleteAccount"
        title={<T id="confirmationDialog.title" />}
        description={<T id="confirmationDialog.description" />}
        confirmationText={user!.name ?? ''}
        submitText={<T id="confirmationDialog.confirm" />}
        onConfirm={deleteAccount}
      />
    </div>
  );
}
