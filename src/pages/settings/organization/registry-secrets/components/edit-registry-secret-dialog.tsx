import { Button, Dialog } from '@koyeb/design-system';
import { RegistrySecret } from 'src/api/model';
import { notify } from 'src/application/notify';
import { Translate } from 'src/intl/translate';
import { RegistrySecretForm } from 'src/modules/secrets/registry/registry-secret-form';

const T = Translate.prefix('pages.organizationSettings.registrySecrets.editDialog');

type EditRegistrySecretDialogProps = {
  open: boolean;
  onClose: () => void;
  secret: RegistrySecret;
};

export function EditRegistrySecretDialog({ open, onClose, secret }: EditRegistrySecretDialogProps) {
  const t = T.useTranslate();

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
      className="col gap-2"
    >
      <RegistrySecretForm
        secret={secret}
        renderFooter={(formState) => (
          <footer className="row mt-2 justify-end gap-2">
            <Button variant="ghost" color="gray" onClick={onClose}>
              <Translate id="common.cancel" />
            </Button>

            <Button type="submit" loading={formState.isSubmitting}>
              <Translate id="common.save" />
            </Button>
          </footer>
        )}
        onSubmitted={(name) => {
          notify.success(t('successNotification', { name }));
          onClose();
        }}
      />
    </Dialog>
  );
}
