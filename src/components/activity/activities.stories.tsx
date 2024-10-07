import { Meta, StoryObj } from '@storybook/react';

import { ApiMock } from 'src/api/mock/mock-api';
import { Activity, ActivityActor } from 'src/api/model';
import { create } from 'src/utils/factories';

import { ActivityItem } from './activity-item';

type Args = {
  activity: Activity;
};

const meta = {
  title: 'Modules/Activity',
  parameters: { className: 'max-w-main', mockApi },
  render: ({ activity }) => <ActivityItem activity={activity} className="rounded-lg border p-3" />,
} satisfies Meta<Args>;

export default meta;
type Story = StoryObj<Args>;

function mockApi() {
  const api = new ApiMock();

  api.mockEndpoint('listApiCredentials', () => ({ credentials: [] }));
}

const user: ActivityActor = {
  type: 'user',
  name: 'User Name',
  metadata: {
    avatar_url: 'https://gravatar.com/avatar?d=retro',
  },
};

const koyeb: ActivityActor = {
  type: 'system_user',
  name: '',
  metadata: {},
};

function createStory(activity: Partial<Activity>): Story {
  return {
    args: { activity: create.activity(activity) },
  };
}

export const domainCreated = createStory({
  actor: user,
  verb: 'created',
  object: create.activityObject({ type: 'domain', name: 'www.koyeb.com' }),
});

export const domainDeleted = createStory({
  actor: user,
  verb: 'deleted',
  object: create.activityObject({ type: 'domain', name: 'www.koyeb.com', deleted: true }),
});

export const domainUpdated = createStory({
  actor: user,
  verb: 'updated',
  object: create.activityObject({ type: 'domain', name: 'www.koyeb.com' }),
});

export const secretCreated = createStory({
  actor: user,
  verb: 'created',
  object: create.activityObject({ type: 'secret', name: 'my-secret-01' }),
});

export const secretDeleted = createStory({
  actor: user,
  verb: 'deleted',
  object: create.activityObject({ type: 'secret', name: 'my-secret-01', deleted: true }),
});

export const secretUpdated = createStory({
  actor: user,
  verb: 'updated',
  object: create.activityObject({ type: 'secret', name: 'my-secret-01' }),
});

const serviceObject = create.activityObject({
  id: 'serviceId',
  type: 'service',
  name: 'my-service',
  metadata: {
    app_id: 'appId',
    app_name: 'my-app',
    service_type: 'web',
  },
});

export const webServiceCreated = createStory({
  actor: user,
  verb: 'created',
  object: serviceObject,
});

export const workerServiceCreated = createStory({
  actor: user,
  verb: 'created',
  object: {
    ...serviceObject,
    metadata: { ...serviceObject.metadata, service_type: 'worker' },
  },
});

export const databaseServiceCreated = createStory({
  actor: user,
  verb: 'created',
  object: {
    ...serviceObject,
    metadata: { ...serviceObject.metadata, service_type: 'database' },
  },
});

export const serviceDeleted = createStory({
  actor: user,
  verb: 'deleted',
  object: { ...serviceObject, deleted: true },
});

export const servicePaused = createStory({
  actor: user,
  verb: 'paused',
  object: serviceObject,
});

export const serviceResumed = createStory({
  actor: user,
  verb: 'resumed',
  object: serviceObject,
});

export const deploymentFailed = createStory({
  actor: koyeb,
  verb: 'failed',
  metadata: {
    messages: ['Provisioning has failed.', 'An error has occurred during the build phase.'],
  },
  object: create.activityObject({
    type: 'deployment',
    name: '43247d2e-5ce2-4d5a-8c1b-521a2f699a82',
    metadata: {
      app_id: 'appId',
      app_name: 'my-app',
      service_id: 'serviceId',
      service_name: 'my-service',
    },
  }),
});

export const serviceAutoScaled = createStory({
  actor: koyeb,
  verb: 'autoscaled',
  metadata: {
    count: 4,
    previous_count: 3,
    region: 'fra',
  },
  object: {
    id: '',
    deleted: false,
    name: '',
    type: '',
    metadata: {
      app_id: 'appId',
      app_name: 'app-name',
      service_id: 'serviceId',
      service_name: 'service-name',
    },
  },
});

export const userLoggedIn = createStory({
  actor: user,
  verb: 'created',
  object: create.activityObject({ type: 'session' }),
});

export const userLoggedOut = createStory({
  actor: user,
  verb: 'deleted',
  object: create.activityObject({ type: 'session', deleted: true }),
});

const appObject = create.activityObject({
  type: 'app',
  name: 'my-app',
});

export const appCreated = createStory({
  actor: user,
  verb: 'created',
  object: appObject,
});

export const appPaused = createStory({
  actor: user,
  verb: 'paused',
  object: appObject,
});

export const appResumed = createStory({
  actor: user,
  verb: 'resumed',
  object: appObject,
});

export const appDeleted = createStory({
  actor: user,
  verb: 'deleted',
  object: { ...appObject, deleted: true },
});

export const paymentFailed = createStory({
  actor: koyeb,
  verb: 'payment_failed',
  object: create.activityObject({ type: 'subscription' }),
});

export const paymentSucceeded = createStory({
  actor: koyeb,
  verb: 'payment_succeeded',
  object: create.activityObject({ type: 'subscription' }),
});

const organizationObject = create.activityObject({
  type: 'organization',
  name: 'my-organization',
});

export const organizationCreated = createStory({
  actor: user,
  verb: 'created',
  object: organizationObject,
});

export const organizationUpdated = createStory({
  actor: user,
  verb: 'updated',
  object: organizationObject,
});

export const organizationPlanUpdated = createStory({
  actor: user,
  verb: 'updated',
  object: organizationObject,
  metadata: { event: 'plan_updated' },
});

export const organizationJoined = createStory({
  actor: user,
  verb: 'joined',
  object: create.activityObject({ type: 'organization_member' }),
});

export const organizationLeft = createStory({
  actor: user,
  verb: 'left',
  object: create.activityObject({ type: 'organization_member' }),
});

export const organizationMemberRemoved = createStory({
  actor: user,
  verb: 'revoked',
  object: create.activityObject({ type: 'organization_member' }),
});

const invitationObject = create.activityObject({
  type: 'organization_invitation',
  metadata: {
    email: 'user@domain.tld',
  },
});

export const organizationInvitationCreated = createStory({
  actor: user,
  verb: 'created',
  object: invitationObject,
});

export const organizationInvitationResent = createStory({
  actor: user,
  verb: 'resent',
  object: invitationObject,
});

export const organizationInvitationDeleted = createStory({
  actor: user,
  verb: 'deleted',
  object: invitationObject,
});

export const organizationInvitationAccepted = createStory({
  actor: user,
  verb: 'accepted',
  object: invitationObject,
});

export const organizationInvitationDeclined = createStory({
  actor: user,
  verb: 'declined',
  object: invitationObject,
});
