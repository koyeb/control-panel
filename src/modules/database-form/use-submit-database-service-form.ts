import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UseFormReturn } from 'react-hook-form';

import { API, ApiFn, apiQuery, useApi, useInvalidateApiQuery, useOrganization } from 'src/api';
import { updateDatabaseService } from 'src/application/service-functions';
import { useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { OrganizationPlan } from 'src/model';
import { hasProperty } from 'src/utils/object';
import { randomString } from 'src/utils/random';

import { databaseInstances } from './database-instance-types';
import { DatabaseServiceForm } from './database-service-form.types';

// cSpell:ignore koyebdb

export function useSubmitDatabaseServiceForm(
  form: UseFormReturn<DatabaseServiceForm>,
  onPlanUpgradeRequired: (plan: OrganizationPlan) => void,
) {
  const api = useApi();
  const organization = useOrganization();

  const queryClient = useQueryClient();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const mutation = useMutation({
    async mutationFn(values: DatabaseServiceForm) {
      const { appId, databaseServiceId } = values.meta;

      if (databaseServiceId) {
        await updateDatabaseService(api, databaseServiceId, (definition) => {
          definition.name = values.serviceName;
          definition.database!.neon_postgres!.instance_type = values.instance;
        });

        return databaseServiceId;
      } else {
        const { service } = await api('post /v1/services', {
          query: { dry_run: false },
          body: createApiService(appId ?? (await getDatabaseAppId(api, values.serviceName)), values),
        });

        return service!.id!;
      }
    },
    async onSuccess(databaseServiceId) {
      await Promise.all([
        invalidate('get /v1/apps'),
        queryClient.invalidateQueries({ queryKey: ['listAppsFull'] }),
        queryClient.prefetchQuery(apiQuery('get /v1/services/{id}', { path: { id: databaseServiceId } })),
      ]);

      await navigate({ to: '/database-services/$databaseServiceId', params: { databaseServiceId } });
    },
    onError: useFormErrorHandler(form, (error) => ({
      serviceName: error.name ?? error['definition.name'],
    })),
  });

  return async (values: DatabaseServiceForm) => {
    const instance = databaseInstances.find(hasProperty('id', values.instance));

    if (instance?.plans !== undefined && !instance.plans.includes(organization!.plan)) {
      onPlanUpgradeRequired(instance.plans[0] as OrganizationPlan);
    } else {
      await mutation.mutateAsync(values).catch(() => {});
    }
  };
}

async function getDatabaseAppId(api: ApiFn, appName: string): Promise<string> {
  const { apps } = await api('get /v1/apps', {
    query: { name: appName },
  });

  for (const app of apps!) {
    if (app.name === appName) {
      return app.id!;
    }
  }

  const { app } = await api('post /v1/apps', {
    body: { name: appName },
  });

  return app!.id!;
}

function createApiService(appId: string, values: DatabaseServiceForm): API.CreateService {
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
