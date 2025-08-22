import { Activity } from 'src/api/model';
import { FormattedPrice } from 'src/intl/formatted';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';
import { capitalize, shortId } from 'src/utils/strings';

import {
  isAppActivity,
  isAutoscalingActivity,
  isBudgetThresholdReachedActivity,
  isDeploymentActivity,
  isOrganizationActivity,
  isOrganizationInvitationActivity,
  isOrganizationMemberActivity,
  isSessionActivity,
  isSubscriptionActivity,
  isVolumeActivity,
} from './activity-guards';

const T = createTranslate('components.activity.sentences');

export function ActivitySentence({ activity }: { activity: Activity }) {
  if (isAutoscalingActivity(activity)) {
    const { count, previousCount } = activity.metadata;
    const direction = previousCount < count ? 'up' : 'down';

    if (count === 0) {
      return <T id="serviceScaledToZero" />;
    }

    if (previousCount === 0) {
      return <T id="serviceScaledFromZero" />;
    }

    return <T id="serviceScaled" values={{ direction, previousCount, count }} />;
  }

  if (isAppActivity(activity)) {
    const name = activity.object.name;

    if (activity.verb === 'paused') {
      return <T id="appPaused" values={{ name }} />;
    }

    if (activity.verb === 'resumed') {
      return <T id="appResumed" values={{ name }} />;
    }

    if (activity.verb === 'deleted') {
      return <T id="appDeleted" values={{ name }} />;
    }
  }

  if (isDeploymentActivity(activity)) {
    if (activity.verb === 'succeeded') {
      return <T id="deploymentSucceeded" values={{ name: shortId(activity.object.name) }} />;
    }

    if (activity.verb === 'failed') {
      return <T id="deploymentFailed" values={{ name: shortId(activity.object.name) }} />;
    }
  }

  if (isSessionActivity(activity)) {
    if (activity.verb === 'created') {
      return <T id="loggedIn" />;
    }

    if (activity.verb === 'deleted') {
      return <T id="loggedOut" />;
    }
  }

  if (isSubscriptionActivity(activity)) {
    const { trial, plan } = activity.object.metadata;

    if (activity.verb === 'created') {
      if (trial && plan) {
        return (
          <T id="subscriptionTrialCreated" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />
        );
      }

      return <T id="subscriptionCreated" />;
    }

    if (activity.verb === 'canceled') {
      return <T id="subscriptionCanceled" />;
    }

    if (activity.verb === 'trial_ended' && plan) {
      return <T id="subscriptionTrialEnded" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />;
    }

    if (activity.verb === 'payment_failed') {
      return <T id="paymentFailed" />;
    }

    if (activity.verb === 'payment_succeeded') {
      return <T id="paymentSucceeded" />;
    }
  }

  if (isOrganizationActivity(activity) && activity.verb === 'updated') {
    const organizationName = activity.object.name;

    if (activity.metadata.event === 'plan_updated') {
      return <T id="organizationPlanUpdated" />;
    }

    if (activity.metadata.event === 'create_budget') {
      return <T id="organizationBudgetCreated" values={{ organizationName }} />;
    }

    if (activity.metadata.event === 'update_budget') {
      return <T id="organizationBudgetUpdated" values={{ organizationName }} />;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (activity.metadata.event === 'delete_budget') {
      return <T id="organizationBudgetDeleted" values={{ organizationName }} />;
    }
  }

  if (isBudgetThresholdReachedActivity(activity)) {
    const { organizationName, budgetAmount, threshold } = activity.metadata;

    return (
      <T
        id={`organizationBudgetThresholdReached${threshold === '100' ? '100' : ''}`}
        values={{
          organizationName,
          threshold: Number(threshold) / 100,
          amount: <FormattedPrice value={Number(budgetAmount)} />,
        }}
      />
    );
  }

  if (isOrganizationInvitationActivity(activity)) {
    if (inArray(activity.verb, ['created', 'resent', 'deleted', 'accepted', 'declined'] as const)) {
      return <T id={`organizationInvitation${capitalize(activity.verb)}`} />;
    }
  }

  if (isOrganizationMemberActivity(activity)) {
    if (activity.verb === 'joined') {
      return <T id="organizationMemberJoined" />;
    }

    if (activity.verb === 'left') {
      return <T id="organizationMemberLeft" />;
    }

    if (activity.verb === 'revoked') {
      return <T id="organizationMemberRemoved" />;
    }
  }

  const name = () => {
    if (inArray(activity.object.type, ['domain', 'secret', 'service', 'persistent_volume'])) {
      return null;
    }

    return <span className="font-medium">{activity.object.name}</span>;
  };

  const object = () => {
    if (isVolumeActivity(activity)) {
      return (
        <span>
          <T id="volume" />
        </span>
      );
    }

    return <span>{activity.object.type}</span>;
  };

  return (
    <T
      id="fallback"
      values={{
        verb: <span className="capitalize">{activity.verb}</span>,
        object: object(),
        name: name(),
      }}
    />
  );
}
