import { intervalToDuration } from 'date-fns';

import { useOrganization } from 'src/api/hooks/session';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

const T = createTranslate('modules.trial.banner');

export function TrialBanner() {
  const trial = defined(useOrganization().trial);
  const { days } = intervalToDuration({ start: new Date(), end: trial.endsAt });

  const upgrade = (children: React.ReactNode) => (
    <Link to={routes.organizationSettings.plans()} className="underline">
      {children}
    </Link>
  );

  return (
    <FeatureFlag feature="trial">
      <div className="bg-green/10 px-4 py-1.5 text-center text-green md:h-full md:whitespace-nowrap">
        <T id="content" values={{ days: defined(days) + 1, upgrade }} />
      </div>
    </FeatureFlag>
  );
}
