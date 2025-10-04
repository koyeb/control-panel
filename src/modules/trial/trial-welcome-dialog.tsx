import { Button } from '@koyeb/design-system';

import { SvgComponent } from 'src/application/types';
import { Dialog, DialogFooter, DialogHeader, closeDialog } from 'src/components/dialog';
import { IconCpu, IconGlobe, IconTrendingUp } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.trial.welcomeDialog');

export function TrialWelcomeDialog() {
  return (
    <Dialog id="TrialWelcome" className="col w-full max-w-2xl gap-8">
      <div className="col gap-6">
        <DialogHeader title={<T id="title" />} />

        <p className="text-dim">
          <T id="description" />
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <TrialFeature Icon={IconCpu} description={<T id="features.gpu" />} />
          <TrialFeature Icon={IconTrendingUp} description={<T id="features.scaling" />} />
          <TrialFeature Icon={IconGlobe} description={<T id="features.cpu" />} />
        </div>
      </div>

      <DialogFooter>
        <p className="me-auto text-dim" onClick={closeDialog}>
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
    <div className="col gap-4 rounded-lg border p-4 shadow">
      <Icon className="size-5 text-green" />
      <div className="font-medium">{description}</div>
    </div>
  );
}
