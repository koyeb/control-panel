import { useState } from 'react';

import { Dialog2 } from '@koyeb/design-system';
import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { DeleteAccount } from './delete-account';
import { Downgrade } from './downgrade';
import { SelectPlan } from './select-plan';

export function TrialEnded() {
  const [dialog, setDialog] = useState<'select-plan' | 'downgrade' | 'delete-account'>('select-plan');

  const content = () => {
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

    return <SelectPlan onDowngrade={() => setDialog('downgrade')} />;
  };

  return (
    <SecondaryLayout>
      <Dialog2 open className="col w-full max-w-4xl gap-8">
        {content()}
      </Dialog2>
    </SecondaryLayout>
  );
}
