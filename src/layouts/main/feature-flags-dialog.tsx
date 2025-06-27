import { Button, ButtonGroup } from '@koyeb/design-system';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { useFeatureFlags } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.featureFlags');

export function FeatureFlagsDialog() {
  const flags = useFeatureFlags();

  return (
    <Dialog id="FeatureFlags" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <div className="row justify-end gap-4">
        <Button color="gray" variant="outline" onClick={() => flags.setAllLocalValues(false)}>
          <T id="disableAll" />
        </Button>

        <Button color="gray" variant="outline" onClick={() => flags.setAllLocalValues(true)}>
          <T id="enableAll" />
        </Button>

        <Button color="gray" variant="outline" onClick={() => flags.setAllLocalValues(undefined)}>
          <T id="resetAll" />
        </Button>
      </div>

      <div className="col gap-2">
        {flags.listFlags().map((flag) => (
          <FeatureFlagItem key={flag} flag={flag} />
        ))}
      </div>

      <DialogFooter>
        <CloseDialogButton />
      </DialogFooter>
    </Dialog>
  );
}

function FeatureFlagItem({ flag }: { flag: string }) {
  const flags = useFeatureFlags();
  const [posthog, local] = flags.getValue(flag);

  return (
    <div className="row items-center justify-between gap-2">
      <div className="col gap-1">
        <div>{flag}</div>
        <div className="text-xs text-dim">
          Default: <T id={posthog ? 'enabled' : 'disabled'} />
        </div>
      </div>

      <ButtonGroup>
        <Button
          variant={local === true ? 'solid' : 'outline'}
          onClick={() => flags.setLocalValue(flag, true)}
          className="capitalize"
        >
          <T id="enabled" />
        </Button>

        <Button
          variant={local === false ? 'solid' : 'outline'}
          onClick={() => flags.setLocalValue(flag, false)}
          className="capitalize"
        >
          <T id="disabled" />
        </Button>

        <Button
          variant={local === undefined ? 'solid' : 'outline'}
          onClick={() => flags.setLocalValue(flag, undefined)}
          className="capitalize"
        >
          <T id="default" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
