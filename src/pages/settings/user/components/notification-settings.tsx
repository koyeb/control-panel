import { Switch } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';

import { mapUserSettings } from 'src/api/mappers/session';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { TextSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.general.notificationSettings');

export function NotificationSettings() {
  const t = T.useTranslate();

  const settingsQuery = useQuery({
    ...useApiQueryFn('getUserSettings'),
    select: ({ settings }) => mapUserSettings(settings!),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('updateUserSettings', ({ enabled }: { enabled: boolean }) => ({
      body: { failed_deployment_email_notification: enabled },
    })),
    async onSuccess(_, { enabled }) {
      await invalidate('getUserSettings');
      notify.success(t('successNotification', { enabled }));
    },
  });

  return (
    <div className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <div>
          <div className="mb-2 font-medium">
            <T id="title" />
          </div>
          <p className="text-dim">
            <T id="description" />
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
