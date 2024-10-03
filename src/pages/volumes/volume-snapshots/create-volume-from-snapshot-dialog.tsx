import { Dialog } from '@koyeb/design-system';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.volumeSnapshots.createVolume');

type CreateVolumeFromSnapshotDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateVolumeFromSnapshotDialog({ open, onClose }: CreateVolumeFromSnapshotDialogProps) {
  return (
    <Dialog isOpen={open} onClose={onClose} title={<T id="title" />} width="xl">
      Create volume
    </Dialog>
  );
}
