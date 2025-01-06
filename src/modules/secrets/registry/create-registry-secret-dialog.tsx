import { Button, Dialog } from '@koyeb/design-system';
import { createTranslate, Translate } from 'src/intl/translate';
import { RegistrySecretForm } from 'src/modules/secrets/registry/registry-secret-form';

const T = createTranslate('secrets.registrySecretForm');

type CreateRegistrySecretDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (secretName: string) => void;
};

export function CreateRegistrySecretDialog({ isOpen, onClose, onCreated }: CreateRegistrySecretDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="xl"
      className="col gap-2"
    >
      <RegistrySecretForm
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
        onSubmitted={onCreated}
      />
    </Dialog>
  );
}
