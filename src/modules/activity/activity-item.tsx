import clsx from 'clsx';

import { Activity } from 'src/api/model';
import { IconClock } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

import { ActivityActorImage } from './activity-actor';
import { ActivityApiCredentialIcon } from './activity-api-credential-icon';
import { isAutoscalingActivity, isDeploymentActivity } from './activity-guards';
import { ActivityResources } from './activity-resources';
import { ActivitySentence } from './activity-sentence';

const T = createTranslate('components.activity.sentences');

export function ActivityItem({ activity, className }: { activity: Activity; className?: string }) {
  const isSystemUser = activity.actor.type === 'system_user';
  const detailsLine = getDetailsLine(activity);

  return (
    <div className={clsx('row items-start gap-4 overflow-hidden', className)}>
      <ActivityActorImage activity={activity} />

      <div className="col min-w-0 flex-1 items-start gap-4">
        <div className="col gap-1 self-stretch">
          <div className="row items-start justify-between gap-2">
            <div className="row items-center gap-1 font-medium">
              {isSystemUser && <ActivitySentence activity={activity} />}
              {!isSystemUser && activity.actor.name}
              <ActivityApiCredentialIcon activity={activity} />
            </div>

            <div className="row items-center gap-1 text-xs whitespace-nowrap text-dim">
              <div>
                <IconClock className="size-4" />
              </div>
              <FormattedDistanceToNow value={activity.createdAt} style="narrow" />
            </div>
          </div>

          {detailsLine && <div className="text-xs text-dim">{detailsLine}</div>}
        </div>

        <ActivityResources activity={activity} />
      </div>
    </div>
  );
}

function getDetailsLine(activity: Activity) {
  if (activity.actor.type !== 'system_user') {
    return <ActivitySentence activity={activity} />;
  }

  if (isDeploymentActivity(activity) && activity.verb === 'failed') {
    return activity.metadata.messages.join(' ');
  }

  if (isAutoscalingActivity(activity) && activity.metadata.count === 0) {
    return <T id="serviceScaledToZeroDetails" />;
  }

  if (isAutoscalingActivity(activity) && activity.metadata.previousCount === 0) {
    return <T id="serviceScaledFromZeroDetails" />;
  }
}
