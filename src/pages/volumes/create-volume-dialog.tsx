import { Button } from '@koyeb/design-system';

import { VolumeSnapshot } from 'src/api/model';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { useNavigate } from 'src/hooks/router';
import { Translate, createTranslate } from 'src/intl/translate';

import { VolumeForm } from './volume-form';

const T = createTranslate('pages.volumes.createDialog');

export function CreateVolumeDialog({ snapshot }: { snapshot?: VolumeSnapshot }) {
  const navigate = useNavigate();
  const closeDialog = Dialog.useClose();

  return (
    <Dialog
      id={snapshot ? 'CreateVolume' : 'CreateVolume'}
      context={snapshot ? { snapshotId: snapshot.id } : undefined}
      className="col w-full max-w-xl gap-4"
    >
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">{<T id="description" />}</p>

      <VolumeForm
        snapshot={snapshot}
        onSubmitted={() => {
          closeDialog();
          navigate({ to: '/volumes' });
        }}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting} autoFocus>
              <Translate id="common.create" />
            </Button>
          </DialogFooter>
        )}
      />
    </Dialog>
  );
}
