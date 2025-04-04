import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { Api } from '../api-types';
import { RegistrySecret, RegistryType, Secret } from '../model';

export function mapSecret(secret: Api.Secret): Secret | RegistrySecret {
  return {
    ...snakeToCamelDeep(requiredDeep(secret)),
    type: lowerCase(secret.type!),
    registry: getRegistryType(secret),
  };
}

function getRegistryType(secret: Api.Secret): RegistryType | undefined {
  if ('docker_hub_registry' in secret) return 'docker-hub';
  if ('digital_ocean_registry' in secret) return 'digital-ocean';
  if ('github_registry' in secret) return 'github';
  if ('gitlab_registry' in secret) return 'gitlab';
  if ('azure_container_registry' in secret) return 'azure';
  if ('gcp_container_registry' in secret) return 'gcp';
  if ('private_registry' in secret) return 'private';
}
