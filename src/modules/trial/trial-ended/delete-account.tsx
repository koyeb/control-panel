import { Alert, Button, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { notify } from 'src/application/notify';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('modules.trial.ended.deleteAccount');

export function DeleteAccount({ onCancel }: { onCancel: () => void }) {
  return (
    <>
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <Alert variant="info" title={<T id="dataLossWarning" />} description={false} />

      <DialogFooter>
        <Button variant="outline" color="gray" onClick={onCancel}>
          <Translate id="common.cancel" />
        </Button>

        <Button type="submit" color="gray" onClick={() => notify.warning('Not implemented')}>
          <T id="submit" />
        </Button>
      </DialogFooter>
    </>
  );
}
