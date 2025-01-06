import { Button, Dialog } from '@koyeb/design-system';
import { notify } from 'src/application/notify';
import { createTranslate, Translate } from 'src/intl/translate';
import { SecretForm } from 'src/modules/secrets/simple/simple-secret-form';

const T = createTranslate('secrets.simpleSecretForm');

type CreateSecretDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (secretName: string) => void;
};

export function CreateSecretDialog({ open, onClose, onCreated }: CreateSecretDialogProps) {
  const t = T.useTranslate();

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="xl"
      className="col gap-2"
    >
      <SecretForm
        renderFooter={(formState) => (
          <footer className="row mt-2 justify-end gap-2">
            <Button variant="ghost" color="gray" onClick={onClose}>
              <Translate id="common.cancel" />
            </Button>

            <Button type="submit" loading={formState.isSubmitting}>
              <Translate id="common.create" />
            </Button>
          </footer>
        )}
        onSubmitted={(secretName) => {
          notify.success(t('createSuccess', { name: secretName }));
          onCreated?.(secretName);
        }}
      />
    </Dialog>
  );
}
