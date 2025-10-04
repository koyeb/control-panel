import { Button } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiMutation, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { useIdentifyUser } from 'src/application/posthog';
import { setToken } from 'src/application/token';
import { openDialog } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { User } from 'src/model';

const T = createTranslate('modules.account.deleteAccount');

export function DeleteAccount() {
  const t = T.useTranslate();

  const user = useUser();
  const organization = useOrganization();
  const canDelete = organization === undefined;

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [, clearIdentify] = useIdentifyUser();

  const deleteMutation = useMutation({
    ...apiMutation('delete /v1/users/{id}', (user: User) => ({
      path: { id: user.id },
    })),
    async onSuccess() {
      clearIdentify();
      await setToken(null, { queryClient });
      await navigate({ to: '/auth/signin' });
      notify.success(t('success'));
    },
  });

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
