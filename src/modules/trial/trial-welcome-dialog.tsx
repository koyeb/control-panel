import { Button } from '@koyeb/design-system';
import { SvgComponent } from 'src/application/types';
import { Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { IconBotMessageSquare, IconCpu, IconSquareCode } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('trial.welcomeDialog');

export function TrialWelcomeDialog() {
  const closeDialog = Dialog.useClose();

  return (
    <Dialog id="TrialWelcome" className="col w-full max-w-2xl gap-8">
      <div className="col gap-6">
        <DialogHeader title={<T id="title" />} />

        <p className="text-dim">
          <T id="description" />
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <TrialFeature Icon={IconBotMessageSquare} description={<T id="features.models" />} />
          <TrialFeature Icon={IconCpu} description={<T id="features.compute" />} />
          <TrialFeature Icon={IconSquareCode} description={<T id="features.web" />} />
        </div>
      </div>

      <DialogFooter>
        <p className="me-auto text-dim">
          <T id="footer" />
        </p>

        <Button size={3} onClick={closeDialog}>
          <T id="cta" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

function TrialFeature({ Icon, description }: { Icon: SvgComponent; description: React.ReactNode }) {
  return (
    <div className="col h-32 justify-between rounded-lg border p-4 shadow">
      <Icon className="size-5 text-green" />
      <div className="font-medium">{description}</div>
    </div>
  );
}
