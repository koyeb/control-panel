import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import type { API } from '../api-types';
import { RegistrySecret, RegistryType, Secret } from '../model';

export function mapSecret(secret: API.Secret): Secret | RegistrySecret {
  return {
    ...snakeToCamelDeep(requiredDeep(secret)),
    registry: getRegistryType(secret),
  };
}

function getRegistryType(secret: API.Secret): RegistryType | undefined {
  if ('docker_hub_registry' in secret) return 'docker-hub';
  if ('digital_ocean_registry' in secret) return 'digital-ocean';
  if ('github_registry' in secret) return 'github';
  if ('gitlab_registry' in secret) return 'gitlab';
  if ('azure_container_registry' in secret) return 'azure';
  if ('gcp_container_registry' in secret) return 'gcp';
  if ('private_registry' in secret) return 'private';
}
