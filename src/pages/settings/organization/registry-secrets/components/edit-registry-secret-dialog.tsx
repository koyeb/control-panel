import { Button } from '@koyeb/design-system';

import { RegistrySecret } from 'src/api/model';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { Translate, createTranslate } from 'src/intl/translate';
import { RegistrySecretForm } from 'src/modules/secrets/registry/registry-secret-form';

const T = createTranslate('pages.organizationSettings.registrySecrets.editDialog');

type EditRegistrySecretDialogProps = {
  secret: RegistrySecret;
};

export function EditRegistrySecretDialog({ secret }: EditRegistrySecretDialogProps) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id="EditRegistrySecret" context={{ secretId: secret.id }} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <RegistrySecretForm
        secret={secret}
        onSubmitted={(name) => {
          notify.success(t('successNotification', { name }));
          closeDialog();
        }}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting}>
              <Translate id="common.save" />
            </Button>
          </DialogFooter>
        )}
      />
    </Dialog>
  );
}
