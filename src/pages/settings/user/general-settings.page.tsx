import { Switch } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { UserProfile, UserSecurity } from '@workos-inc/widgets';
import { lazy } from 'react';

import { apiMutation, apiQuery, mapUserSettings, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';
import { DeleteAccount } from 'src/modules/account/delete-account';

const WorkOSWidgetsProvider = lazy(() => import('src/components/workos-widgets-provider'));

export function GeneralSettingsPage() {
  return (
    <>
      <AuthKitUserSettings />
      <NotificationSettings />
      <DeleteAccount />
    </>
  );
}

export function AuthKitUserSettings() {
  return (
    <WorkOSWidgetsProvider>
      {(token) => (
        <div className="col gap-8">
          <UserProfile authToken={token} />
          <UserSecurity authToken={token} />
        </div>
      )}
    </WorkOSWidgetsProvider>
  );
}

const T = createTranslate('pages.userSettings.general');

export function NotificationSettings() {
  const t = T.useTranslate();

  const settingsQuery = useQuery({
    ...apiQuery('get /v1/account/settings', {}),
    select: ({ settings }) => mapUserSettings(settings!),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('patch /v1/account/settings', ({ enabled }: { enabled: boolean }) => ({
      body: { failed_deployment_email_notification: enabled },
    })),
    async onSuccess(_, { enabled }) {
      await invalidate('get /v1/account/settings');
      notify.success(t('notificationSettings.successNotification', { enabled }));
    },
  });

  return (
    <div className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <div>
          <div className="mb-2 font-medium">
            <T id="notificationSettings.title" />
          </div>
          <p className="text-dim">
            <T id="notificationSettings.description" />
          </p>
        </div>

        {settingsQuery.isPending && <TextSkeleton width={4} />}

        {settingsQuery.isSuccess && (
          <Switch
            checked={settingsQuery.data.failedDeploymentEmailNotification}
            onChange={(event) => mutation.mutate({ enabled: event.target.checked })}
          />
        )}
      </div>
    </div>
  );
}
