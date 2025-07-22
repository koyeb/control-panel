import { OrganizationPlan } from 'src/api/model';
import { SvgComponent, SvgProps } from 'src/application/types';

import { IconCrown, IconGem, IconRocket } from '../icons';

export function PlanIcon({ plan, ...props }: { plan?: OrganizationPlan } & SvgProps) {
  const Icon = map[plan!];

  if (Icon) {
    return <Icon {...props} />;
  }

  return null;
}

const map: Partial<Record<OrganizationPlan, SvgComponent>> = {
  starter: IconRocket,
  startup: IconGem,
  pro: IconGem,
  scale: IconCrown,
};
