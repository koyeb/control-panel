import { Button } from '@koyeb/design-system';

import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { Translate, createTranslate } from 'src/intl/translate';
import { SecretForm } from 'src/modules/secrets/simple/simple-secret-form';

const T = createTranslate('modules.secrets.simpleSecretForm');

type CreateSecretDialogProps = {
  onCreated?: (secretName: string) => void;
};

export function CreateSecretDialog({ onCreated }: CreateSecretDialogProps) {
  const t = T.useTranslate();

  return (
    <Dialog id="CreateSecret" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <SecretForm
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting}>
              <Translate id="common.create" />
            </Button>
          </DialogFooter>
        )}
        onSubmitted={(secretName) => {
          notify.success(t('createSuccessNotification', { name: secretName }));
          closeDialog();
          onCreated?.(secretName);
        }}
      />
    </Dialog>
  );
}
