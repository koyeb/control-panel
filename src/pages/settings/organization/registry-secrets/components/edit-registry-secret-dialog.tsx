import { Button } from '@koyeb/design-system';

import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { Translate, createTranslate } from 'src/intl/translate';
import { RegistrySecretForm } from 'src/modules/secrets/registry/registry-secret-form';

const T = createTranslate('pages.organizationSettings.registrySecrets.editDialog');

export function EditRegistrySecretDialog() {
  const t = T.useTranslate();

  return (
    <Dialog id="EditRegistrySecret" className="col w-full max-w-xl gap-4">
      {(secret) => (
        <>
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
        </>
      )}
    </Dialog>
  );
}
