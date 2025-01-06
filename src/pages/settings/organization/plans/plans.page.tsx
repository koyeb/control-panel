import { ExternalLink } from 'src/components/link';
import { SectionHeader } from 'src/components/section-header';
import { createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

import { ChangePlanEnterpriseButton, ChangePlanButton } from './change-plan-button';
import { PlanCard } from './plan-card';

type Plan = 'starter' | 'pro' | 'scale' | 'enterprise';

const T = createTranslate('pages.organizationSettings.plans');

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

const plans: Array<{ plan: Plan; featuresCount: number }> = [
  { plan: 'starter', featuresCount: 6 },
  { plan: 'pro', featuresCount: 6 },
  { plan: 'scale', featuresCount: 6 },
  { plan: 'enterprise', featuresCount: 7 },
];

function PlansCards() {
  const features = (plan: Plan, count: number) => {
    return createArray(count, (index) => <T id={`plans.${plan}.features.feature${(index + 1) as 1}`} />);
  };

  const price = (children: React.ReactNode) => {
    return <span className="text-lg">{children}</span>;
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {plans.map(({ plan, featuresCount }) => (
        <PlanCard
          key={plan}
          name={<T id={`plans.${plan}.name`} />}
          description={<T id={`plans.${plan}.description`} />}
          price={<T id={`plans.${plan}.price`} values={{ price }} />}
          features={features(plan, featuresCount)}
          cta={plan === 'enterprise' ? <ChangePlanEnterpriseButton /> : <ChangePlanButton plan={plan} />}
        />
      ))}
    </div>
  );
}
