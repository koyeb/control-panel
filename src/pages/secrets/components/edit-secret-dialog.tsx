import { Button } from '@koyeb/design-system';
import { Secret } from 'src/api/model';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { Translate, createTranslate } from 'src/intl/translate';
import { SecretForm } from 'src/modules/secrets/simple/simple-secret-form';

const T = createTranslate('pages.secrets.editSecretDialog');

type EditSecretDialogProps = {
  secret: Secret;
};

export function EditSecretDialog({ secret }: EditSecretDialogProps) {
  const t = T.useTranslate();
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id="EditSecret" context={{ secretId: secret.id }} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <SecretForm
        secret={secret}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting}>
              <T id="confirm" />
            </Button>
          </DialogFooter>
        )}
        onSubmitted={(name) => {
          notify.success(t('successNotification', { name }));
          closeDialog();
        }}
      />
    </Dialog>
  );
}
