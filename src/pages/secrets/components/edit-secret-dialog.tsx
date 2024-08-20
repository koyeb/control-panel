import { Button, Dialog } from '@koyeb/design-system';
import { Secret } from 'src/api/model';
import { notify } from 'src/application/notify';
import { Translate, useTranslate } from 'src/intl/translate';
import { SecretForm } from 'src/modules/secrets/simple/simple-secret-form';

const T = Translate.prefix('pages.secrets.editSecretDialog');

type EditSecretDialogProps = {
  open: boolean;
  onClose: () => void;
  secret: Secret;
};

export function EditSecretDialog({ open, onClose, secret }: EditSecretDialogProps) {
  const t = useTranslate();

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
      className="col gap-2"
    >
      <SecretForm
        secret={secret}
        renderFooter={(formState) => (
          <footer className="row mt-2 justify-end gap-2">
            <Button variant="ghost" color="gray" onClick={onClose}>
              <Translate id="common.cancel" />
            </Button>

            <Button type="submit" loading={formState.isSubmitting}>
              <T id="confirm" />
            </Button>
          </footer>
        )}
        onSubmitted={(name) => {
          notify.success(t('secrets.simpleSecretForm.editSuccess', { name }));
          onClose();
        }}
      />
    </Dialog>
  );
}
