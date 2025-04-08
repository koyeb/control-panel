import { useMutation } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';

import { api, ApiEndpointParams } from 'src/api/api';
import { useOrganization } from 'src/api/hooks/session';
import { OrganizationPlan } from 'src/api/model';
import { useInvalidateApiQuery, usePrefetchApiQuery } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { updateDatabaseService } from 'src/application/service-functions';
import { useToken } from 'src/application/token';
import { useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useSearchParam } from 'src/hooks/router';
import { hasProperty } from 'src/utils/object';
import { randomString } from 'src/utils/random';

import { databaseInstances } from './database-instance-types';
import { DatabaseServiceForm } from './database-service-form.types';

// cSpell:ignore koyebdb

export function useSubmitDatabaseServiceForm(
  form: UseFormReturn<DatabaseServiceForm>,
  onPlanUpgradeRequired: (plan: OrganizationPlan) => void,
) {
  const [appId] = useSearchParam('app_id');
  const organization = useOrganization();
  const { token } = useToken();
  const invalidate = useInvalidateApiQuery();
  const prefetch = usePrefetchApiQuery();
  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn(values: DatabaseServiceForm) {
      const { databaseServiceId } = values.meta;

      if (databaseServiceId) {
        await updateDatabaseService(databaseServiceId, (definition) => {
          definition.name = values.serviceName;
          definition.database!.neon_postgres!.instance_type = values.instance;
        });

        return databaseServiceId;
      } else {
        const { service } = await api.createService({
          token,
          query: { dry_run: false },
          body: createApiService(appId ?? (await getDatabaseAppId(token, values.serviceName)), values),
        });

        return service!.id!;
      }
    },
    async onSuccess(databaseServiceId) {
      await Promise.all([
        invalidate('listApps'),
        prefetch('getService', { path: { id: databaseServiceId } }),
      ]);

      navigate(routes.database.overview(databaseServiceId));
    },
    onError: useFormErrorHandler(form, (error) => ({
      serviceName: error.name ?? error['definition.name'],
    })),
  });

  return async (values: DatabaseServiceForm) => {
    const instance = databaseInstances.find(hasProperty('id', values.instance));

    if (instance?.plans !== undefined && !instance.plans.includes(organization.plan)) {
      onPlanUpgradeRequired(instance.plans[0] as OrganizationPlan);
    } else {
      await mutation.mutateAsync(values).catch(() => {});
    }
  };
}

async function getDatabaseAppId(token: string | undefined, appName: string): Promise<string> {
  const { apps } = await api.listApps({
    token,
    query: { name: appName },
  });

  for (const app of apps!) {
    if (app.name === appName) {
      return app.id!;
    }
  }

  const { app } = await api.createApp({
    token,
    body: { name: appName },
  });

  return app!.id!;
}

function createApiService(
  appId: string,
  values: DatabaseServiceForm,
): ApiEndpointParams<'createService'>['body'] {
  return {
    app_id: appId,
    definition: {
      type: 'DATABASE',
      name: values.serviceName,
      database: {
        neon_postgres: {
          pg_version: values.engine.version,
          region: values.region,
          roles: [{ name: values.defaultRole, secret: databaseRoleSecret(values.serviceName) }],
          instance_type: values.instance,
          databases: [{ name: 'koyebdb', owner: values.defaultRole }],
        },
      },
    },
  };
}

function databaseRoleSecret(databaseServiceName: string) {
  return `${databaseServiceName}-${randomString()}`;
}
