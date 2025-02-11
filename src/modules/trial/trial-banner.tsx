import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

import { useTrial } from './use-trial';

const T = createTranslate('modules.trial.banner');

export function TrialBanner() {
  const trial = defined(useTrial());

  const upgrade = (children: React.ReactNode) => (
    <Link to={routes.organizationSettings.plans()} className="underline">
      {children}
    </Link>
  );

  return (
    <div className="bg-green/10 px-4 py-1.5 text-center text-green md:h-full md:whitespace-nowrap">
      <T id="content" values={{ days: trial.daysLeft, upgrade }} />
    </div>
  );
}
