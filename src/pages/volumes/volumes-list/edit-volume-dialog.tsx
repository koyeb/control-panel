import { Button } from '@koyeb/design-system';
import { Volume } from 'src/api/model';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { createTranslate, Translate } from 'src/intl/translate';

import { VolumeForm } from '../volume-form';

const T = createTranslate('pages.volumes.editDialog');

export function EditVolumeDialog({ volume }: { volume: Volume }) {
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id={`EditVolume-${volume.id}`} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <VolumeForm
        volume={volume}
        onSubmitted={closeDialog}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting} autoFocus>
              <Translate id="common.save" />
            </Button>
          </DialogFooter>
        )}
      />
    </Dialog>
  );
}
