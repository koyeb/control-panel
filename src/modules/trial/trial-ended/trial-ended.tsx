import { useState } from 'react';

import { Dialog } from '@koyeb/design-system';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';
import { defined } from 'src/utils/assert';

import { DeleteAccount } from './delete-account';
import { Downgrade } from './downgrade';
import { SelectPlan } from './select-plan';
import { Upgrade } from './upgrade';

export function TrialEnded() {
  const [dialog, setDialog] = useState<'select-plan' | 'upgrade' | 'downgrade' | 'delete-account'>(
    'select-plan',
  );

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'scale'>();

  const content = () => {
    if (dialog === 'upgrade') {
      return (
        <Upgrade
          plan={defined(selectedPlan)}
          onCancel={() => {
            setSelectedPlan(undefined);
            setDialog('select-plan');
          }}
        />
      );
    }

    if (dialog === 'downgrade') {
      return (
        <Downgrade
          onCancel={() => setDialog('select-plan')}
          onDeleteAccount={() => setDialog('delete-account')}
        />
      );
    }

    if (dialog === 'delete-account') {
      return <DeleteAccount onCancel={() => setDialog('select-plan')} />;
    }

    return (
      <SelectPlan
        onDowngrade={() => setDialog('downgrade')}
        onSelected={(plan) => {
          setSelectedPlan(plan);
          setDialog('upgrade');
        }}
      />
    );
  };

  return (
    <SecondaryLayout>
      <Dialog open className="col w-full max-w-4xl gap-8">
        {content()}
      </Dialog>
    </SecondaryLayout>
  );
}
