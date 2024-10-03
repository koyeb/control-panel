import { Button, Dialog } from '@koyeb/design-system';
import { Volume } from 'src/api/model';
import { Translate } from 'src/intl/translate';

import { VolumeForm } from './volume-form';

const T = Translate.prefix('volumes.createDialog');

type CreateVolumeDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (volume: Volume) => void;
};

export function CreateVolumeDialog({ open, onClose, onCreated }: CreateVolumeDialogProps) {
  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
    >
      <VolumeForm
        onSubmitted={(volume) => {
          onClose();
          onCreated?.(volume);
        }}
        renderFooter={(formState) => (
          <footer className="row mt-2 justify-end gap-2">
            <Button variant="ghost" color="gray" onClick={onClose}>
              <Translate id="common.cancel" />
            </Button>

            <Button type="submit" loading={formState.isSubmitting} autoFocus>
              <Translate id="common.create" />
            </Button>
          </footer>
        )}
      />
    </Dialog>
  );
}
