import clsx from 'clsx';

import { Activity } from 'src/api/model';
import {
  IconBox,
  IconBoxes,
  IconBuilding,
  IconCreditCard,
  IconFileKey2,
  IconGlobe,
  IconUserRound,
  IconUsers,
} from 'src/components/icons';
import { inArray } from 'src/utils/arrays';

export function ActivityIcon({ activity }: { activity: Activity }) {
  const Icon = icons[activity.object.type] ?? (() => null);
  const color = getActivityColor(activity);

  return (
    <div
      className={clsx('rounded-full border p-1.5', {
        'border-red/50 bg-red/10': color === 'red',
        'border-green/50 bg-green/10': color === 'green',
        'border-blue/50 bg-blue/10': color === 'blue',
        'border-orange/50 bg-orange/10': color === 'orange',
      })}
    >
      <Icon
        className={clsx('size-3.5', {
          'text-red': color === 'red',
          'text-green': color === 'green',
          'text-blue': color === 'blue',
          'text-orange': color === 'orange',
        })}
      />
    </div>
  );
}

const icons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  domain: IconGlobe,
  secret: IconFileKey2,
  session: IconUserRound,
  app: IconBoxes,
  service: IconBox,
  deployment: IconBox,
  subscription: IconCreditCard,
  organization: IconBuilding,
  organization_invitation: IconUsers,
  organization_member: IconUsers,
};

function getActivityColor(activity: Activity): 'green' | 'blue' | 'red' | 'orange' | 'gray' {
  const verb = activity.verb;
  const object = activity.object.type;

  if (object === 'session') {
    return 'blue';
  }

  if (verb === 'created') {
    return 'green';
  }

  if (inArray(verb, ['joined', 'accepted'])) {
    return 'green';
  }

  if (inArray(verb, ['deleted', 'failed', 'payment_failed', 'left', 'revoked', 'declined'])) {
    return 'red';
  }

  if (inArray(verb, ['updated', 'resumed', 'autoscaled', 'payment_succeeded', 'resent'])) {
    return 'blue';
  }

  if (inArray(verb, ['paused'])) {
    return 'orange';
  }

  return 'gray';
}
