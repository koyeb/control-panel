import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useOrganizationQuery, useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { ConfirmationDialog } from 'src/components/confirmation-dialog';
import { useNavigate } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.userSettings.general.deleteAccount');

export function DeleteAccount() {
  const user = useUser();
  const { data: organization } = useOrganizationQuery();
  const canDelete = organization === undefined;

  const { clearToken } = useAccessToken();
  const navigate = useNavigate();

  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutateAsync: deleteAccount } = useMutation({
    ...useApiMutationFn('deleteUser', {
      path: { id: user.id },
    }),
    onSuccess() {
      clearToken();
      navigate(routes.signIn());
    },
  });

  return (
    <div className="card border-red">
      <div className="col gap-4 p-4">
        <div>
          <T id="label" />
        </div>
        <p>
          <T id="description" />
        </p>
      </div>

      <footer>
        <p className="text-xs text-dim">{!canDelete && <T id="mustLeaveOrganizations" />}</p>

        <Button disabled={!canDelete} onClick={() => setDialogOpen(true)}>
          <T id="deleteAccount" />
        </Button>
      </footer>

      <ConfirmationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={<T id="deleteAccount" />}
        description={<T id="confirmationText" />}
        confirmationText={user.name}
        submitText={<T id="deleteAccount" />}
        onConfirm={deleteAccount}
      />
    </div>
  );
}
