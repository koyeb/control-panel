import { useState } from 'react';

import { SecondaryLayout } from 'src/layouts/secondary/secondary-layout';

import { DowngradeDialog } from './downgrade-dialog';
import { SelectPlanDialog } from './select-plan-dialog';

export function TrialEnded() {
  const [downgrade, setDowngrade] = useState(false);

  const content = () => {
    if (downgrade) {
      return <DowngradeDialog onCancel={() => setDowngrade(false)} />;
    }

    return <SelectPlanDialog onDowngrade={() => setDowngrade(true)} />;
  };

  return <SecondaryLayout>{content()}</SecondaryLayout>;
}
