import { ExternalLink } from 'src/components/link';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

import { ChangePlanBusinessButton, ChangePlanButton } from './change-plan-button';
import { PlanCard } from './plan-card';

type Plan = 'starter' | 'pro' | 'scale' | 'business';

const T = Translate.prefix('pages.organizationSettings.plans');

export function PlansPage() {
  const pricing = (children: React.ReactNode) => (
    <ExternalLink openInNewTab href="https://koyeb.com/pricing#features" className="underline">
      {children}
    </ExternalLink>
  );

  return (
    <div className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" values={{ pricing }} />} />
      <PlansCards />
    </div>
  );
}

const plans: Array<{ plan: Plan; price: number }> = [
  { plan: 'starter', price: 0 },
  { plan: 'pro', price: 29 },
  { plan: 'scale', price: 299 },
  { plan: 'business', price: 700 },
];

function PlansCards() {
  const features = (plan: Plan, count: number) => {
    return createArray(count, (index) => <T id={`plans.${plan}.features.feature${(index + 1) as 1}`} />);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {plans.map(({ plan, price }) => (
        <PlanCard
          key={plan}
          name={<T id={`plans.${plan}.name`} />}
          description={<T id={`plans.${plan}.description`} />}
          price={price}
          features={features(plan, 7)}
          cta={plan === 'business' ? <ChangePlanBusinessButton /> : <ChangePlanButton plan={plan} />}
        />
      ))}
    </div>
  );
}
