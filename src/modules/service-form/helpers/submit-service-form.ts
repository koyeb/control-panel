import { ApiError, ApiFn } from 'src/api';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../service-form.types';

import { serviceFormToDeploymentDefinition } from './service-form-to-deployment';

const uuid = '15c6a049-6594-4df0-99c3-a5c262e69624';

type SubmitServiceFormResult = {
  appId: string;
  serviceId: string;
  deploymentId: string;
};

export async function submitServiceForm(api: ApiFn, form: ServiceForm): Promise<SubmitServiceFormResult> {
  let appId = form.meta.appId ?? undefined;
  const serviceId = form.meta.serviceId;

  if (serviceId === null) {
    await createService(api, uuid, form, true);
  }

  if (!appId) {
    appId = await findOrCreateApp(api, form.appName);
  }

  await createVolumes(api, form);

  if (serviceId === null) {
    return createService(api, appId, form);
  } else {
    return updateService(api, serviceId, form);
  }
}

async function findOrCreateApp(api: ApiFn, appName: string): Promise<string> {
  const { apps } = await api('get /v1/apps', {
    query: { name: appName, limit: '100' },
  });

  const app = apps?.find(hasProperty('name', appName));

  if (app !== undefined) {
    return app.id!;
  }

  const { app: newApp } = await api('post /v1/apps', {
    body: { name: appName },
  });

  return newApp!.id!;
}

async function createVolumes(api: ApiFn, form: ServiceForm): Promise<void> {
  const { volumes: existingVolumes } = await api('get /v1/volumes', {
    query: { limit: '100' },
  });

  for (const volume of form.volumes) {
    if (volume.volumeId !== undefined) {
      continue;
    }

    const existingVolume = existingVolumes?.find(hasProperty('name', volume.name));

    if (existingVolume !== undefined) {
      volume.volumeId = existingVolume.id;
      continue;
    }

    volume.volumeId = await createVolume(
      api,
      form.volumes.indexOf(volume),
      volume.name,
      volume.size,
      form.regions[0]!,
    );
  }
}

async function createVolume(
  api: ApiFn,
  index: number,
  name: string,
  size: number,
  region: string,
): Promise<string> {
  try {
    const response = await api('post /v1/volumes', {
      body: {
        name,
        max_size: size,
        region,
        volume_type: 'PERSISTENT_VOLUME_BACKING_STORE_LOCAL_BLK',
      },
    });

    return response.volume!.id!;
  } catch (error) {
    if (ApiError.isValidationError(error)) {
      for (const field of error.body.fields) {
        field.field = `volumes.${index}.${field.field}`;
      }
    }

    throw error;
  }
}

async function createService(api: ApiFn, appId: string, form: ServiceForm, dryRun: true): Promise<void>;

async function createService(
  api: ApiFn,
  appId: string,
  form: ServiceForm,
  dryRun?: false,
): Promise<SubmitServiceFormResult>;

async function createService(
  api: ApiFn,
  appId: string,
  form: ServiceForm,
  dryRun = false,
): Promise<SubmitServiceFormResult | void> {
  const definition = serviceFormToDeploymentDefinition(form);

  if (dryRun) {
    definition.volumes = definition.volumes?.filter((volume) => volume.id !== undefined);
  }

  const result = await api('post /v1/services', {
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

async function updateService(
  api: ApiFn,
  serviceId: string,
  form: ServiceForm,
): Promise<SubmitServiceFormResult> {
  const result = await api('put /v1/services/{id}', {
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
