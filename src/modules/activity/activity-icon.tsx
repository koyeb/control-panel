import clsx from 'clsx';

import { Activity } from 'src/api/model';
import { SvgComponent } from 'src/application/types';
import {
  IconBox,
  IconBoxes,
  IconBuilding,
  IconCreditCard,
  IconFileKey2,
  IconFolders,
  IconGlobe,
  IconUserRound,
  IconUsers,
} from 'src/icons';
import { inArray } from 'src/utils/arrays';
import { entries } from 'src/utils/object';

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

const icons: Record<string, SvgComponent> = {
  domain: IconGlobe,
  secret: IconFileKey2,
  session: IconUserRound,
  app: IconBoxes,
  service: IconBox,
  deployment: IconBox,
  persistent_volume: IconFolders,
  subscription: IconCreditCard,
  organization: IconBuilding,
  organization_invitation: IconUsers,
  organization_member: IconUsers,
};

type Color = 'green' | 'blue' | 'red' | 'orange' | 'gray';

function getActivityColor(activity: Activity): Color {
  const verb = activity.verb;
  const object = activity.object.type;

  if (object === 'session') {
    return 'blue';
  }

  for (const [key, value] of entries(verbMapping)) {
    if (inArray(verb, value)) {
      return key;
    }
  }

  return 'gray';
}

const verbMapping: Record<Color, string[]> = {
  green: ['created', 'succeeded', 'joined', 'accepted'],
  red: ['deleted', 'failed', 'payment_failed', 'left', 'revoked', 'declined'],
  blue: ['updated', 'resumed', 'autoscaled', 'payment_succeeded', 'resent', 'attached', 'detached'],
  orange: ['paused'],
  gray: [],
};
