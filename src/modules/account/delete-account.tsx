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

const T = Translate.prefix('account.deleteAccount');

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

        <Button color="red" disabled={!canDelete} onClick={() => setDialogOpen(true)}>
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
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={<T id="confirmationDialog.title" />}
        description={<T id="confirmationDialog.description" />}
        confirmationText={user.name}
        submitText={<T id="confirmationDialog.confirm" />}
        onConfirm={deleteAccount}
      />
    </div>
  );
}