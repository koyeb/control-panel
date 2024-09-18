import { api } from 'src/api/api';
import { getAccessToken } from 'src/application/token';
import { hasProperty } from 'src/utils/object';

import { serviceFormToDeploymentDefinition } from './helpers/service-form-to-deployment';
import { ServiceForm } from './service-form.types';

const uuid = '15c6a049-6594-4df0-99c3-a5c262e69624';

type SubmitServiceFormResult = {
  appId: string;
  serviceId: string;
  deploymentId: string;
};

export async function submitServiceForm(form: ServiceForm): Promise<SubmitServiceFormResult> {
  let appId: string | null | undefined = form.meta.appId;
  const serviceId = form.meta.serviceId;

  if (serviceId === null) {
    await createService(uuid, form, true);
  }

  if (!appId) {
    appId = await findOrCreateApp(form.appName);
  }

  await createVolumes(form);

  if (serviceId === null) {
    return createService(appId, form);
  } else {
    return updateService(serviceId, form);
  }
}

async function findOrCreateApp(appName: string): Promise<string> {
  const { apps } = await api.listApps({
    token: getAccessToken() ?? undefined,
    query: { name: appName, limit: '100' },
  });

  const app = apps?.find(hasProperty('name', appName));

  if (app !== undefined) {
    return app.id!;
  }

  const { app: newApp } = await api.createApp({
    token: getAccessToken() ?? undefined,
    body: { name: appName },
  });

  return newApp!.id!;
}

async function createVolumes(form: ServiceForm): Promise<void> {
  for (const volume of form.volumes) {
    if (volume.volumeId !== undefined) {
      continue;
    }

    const response = await api.createVolume({
      token: getAccessToken() ?? undefined,
      body: {
        name: volume.name,
        max_size: volume.size,
        region: form.regions[0],
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK',
      },
    });

    volume.volumeId = response.volume?.id;
  }
}

async function createService(appId: string, form: ServiceForm, dryRun: true): Promise<void>;

async function createService(
  appId: string,
  form: ServiceForm,
  dryRun?: false,
): Promise<SubmitServiceFormResult>;

async function createService(
  appId: string,
  form: ServiceForm,
  dryRun = false,
): Promise<SubmitServiceFormResult | void> {
  const definition = serviceFormToDeploymentDefinition(form);

  if (dryRun) {
    delete definition.volumes;
  }

  const result = await api.createService({
    token: getAccessToken() ?? undefined,
    query: { dry_run: dryRun },
    body: {
      app_id: appId,
      definition,
    },
  });

  if (dryRun) {
    return;
  }

  return {
    appId: result.service!.app_id!,
    serviceId: result.service!.id!,
    deploymentId: result.service!.latest_deployment_id!,
  };
}

async function updateService(serviceId: string, form: ServiceForm): Promise<SubmitServiceFormResult> {
  const result = await api.updateService({
    token: getAccessToken() ?? undefined,
    path: { id: serviceId },
    query: { dry_run: false },
    body: {
      definition: serviceFormToDeploymentDefinition(form),
      skip_build: form.meta.skipBuild,
      save_only: form.meta.saveOnly,
    },
  });

  return {
    appId: result.service!.app_id!,
    serviceId: result.service!.id!,
    deploymentId: result.service!.latest_deployment_id!,
  };
}
