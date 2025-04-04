import clsx from 'clsx';

import { Activity } from 'src/api/model';
import { IconClock } from 'src/components/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { ActivityActorImage } from 'src/modules/activity/activity-actor';
import { ActivityApiCredentialIcon } from 'src/modules/activity/activity-api-credential-icon';
import { ActivityIcon } from 'src/modules/activity/activity-icon';
import { ActivityResources } from 'src/modules/activity/activity-resources';
import { ActivitySentence } from 'src/modules/activity/activity-sentence';

const T = createTranslate('pages.home.activity');

export function ActivityItem({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  return (
    <div className="row">
      <div className="col items-center px-6">
        <div className="flex-1 border-l-2" />

        <ActivityIcon activity={activity} />

        <div className="flex-1 border-l-2" />
      </div>

      <div
        className={clsx(
          'col mr-6 flex-1 items-start justify-center gap-2 overflow-hidden py-6',
          !isLast && 'border-b',
        )}
      >
        <div className="row w-full items-center justify-between gap-2">
          <div className="row items-center gap-2">
            <ActivityActorImage activity={activity} />
            {activity.actor.type === 'system_user' && <T id="systemUser" />}
            {activity.actor.type !== 'system_user' && activity.actor.name}
            <ActivityApiCredentialIcon activity={activity} />
          </div>

          <div className="row items-center gap-1 text-xs text-dim">
            <IconClock className="size-4" />
            <FormattedDistanceToNow value={activity.createdAt} style="narrow" />
          </div>
        </div>

        <div className="text-xs text-dim">
          <ActivitySentence activity={activity} />
        </div>

        <ActivityResources activity={activity} />
      </div>
    </div>
  );
}
