import { Button, Dialog } from '@koyeb/design-system';
import { VolumeSnapshot } from 'src/api/model';
import { routes } from 'src/application/routes';
import { useNavigate } from 'src/hooks/router';
import { createTranslate, Translate } from 'src/intl/translate';

import { VolumeForm } from './volume-form';

const T = createTranslate('volumes.createDialog');

type CreateVolumeDialogProps = {
  open: boolean;
  onClose: () => void;
  snapshot?: VolumeSnapshot;
};

export function CreateVolumeDialog({ open, onClose, snapshot }: CreateVolumeDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
    >
      <VolumeForm
        snapshot={snapshot}
        onSubmitted={() => {
          onClose();
          navigate(routes.volumes.index());
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
