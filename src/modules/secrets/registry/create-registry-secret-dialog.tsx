import { Button } from '@koyeb/design-system';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { createTranslate, Translate } from 'src/intl/translate';
import { RegistrySecretForm } from 'src/modules/secrets/registry/registry-secret-form';

const T = createTranslate('modules.secrets.registrySecretForm');

type CreateRegistrySecretDialogProps = {
  onCreated?: (secretName: string) => void;
};

export function CreateRegistrySecretDialog({ onCreated }: CreateRegistrySecretDialogProps) {
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id="CreateRegistrySecret" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <RegistrySecretForm
        onSubmitted={(secretName) => {
          closeDialog();
          onCreated?.(secretName);
        }}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton />

            <Button type="submit" loading={formState.isSubmitting}>
              <Translate id="common.save" />
            </Button>
          </DialogFooter>
        )}
      />
    </Dialog>
  );
}
