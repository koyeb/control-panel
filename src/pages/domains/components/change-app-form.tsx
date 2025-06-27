import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';

import { api } from 'src/api/api';
import { useApps } from 'src/api/hooks/service';
import { Domain } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { useToken } from 'src/application/token';
import { ControlledSelect } from 'src/components/controlled';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

const T = createTranslate('pages.domains.domainsList.changeApp');

export function ChangeAppForm({ domain }: { domain: Domain }) {
  const { token } = useToken();
  const t = T.useTranslate();

  const apps = useApps();
  const invalidate = useInvalidateApiQuery();

  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<{ appId: string | null }>({
    defaultValues: {
      appId: domain.appId,
    },
  });

  const mutation = useMutation({
    async mutationFn({ appId }: { appId: string | null }) {
      if (appId === domain.appId) {
        return false;
      }

      await api.editDomain({
        token,
        path: { id: domain.id },
        query: {},
        body: { app_id: appId as string | undefined },
      });
    },
    async onSuccess(result, values) {
      if (result === false) {
        return;
      }

      await invalidate('listDomains');

      form.reset(values);

      const app = apps?.find(hasProperty('id', values.appId));

      if (app) {
        notify.success(t('appAttachedSuccessNotification', { domainName: domain.name, appName: app.name }));
      } else {
        notify.success(t('appDetachedSuccessNotification', { domainName: domain.name }));
      }
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit(form, mutation.mutateAsync)} className="row items-end gap-4">
      <ControlledSelect
        control={form.control}
        name="appId"
        label={<T id="app.label" values={{ domainName: domain.name }} />}
        placeholder={t('app.placeholder')}
        items={['none', ...(apps ?? [])] as const}
        getKey={(app) => (app === 'none' ? 'none' : app.id)}
        itemToString={(app) => (app === 'none' ? 'none' : app.name)}
        itemToValue={(app) => (app === 'none' ? null : app.id)}
        renderItem={(app) => (app === 'none' ? <T id="noApp" /> : app.name)}
        className="max-w-sm"
      />

      <Button variant="ghost" type="submit">
        <T id="submit" />
      </Button>
    </form>
  );
}
