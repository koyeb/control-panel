import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import { RegistryType, Secret } from '../model';

export function mapSecretsList({ secrets }: ApiEndpointResult<'listSecrets'>): Secret[] {
  return secrets!.map((secret) => ({
    id: secret.id!,
    type: lowerCase(secret.type!),
    name: secret.name!,
    createdAt: secret.created_at!,
    updatedAt: secret.updated_at!,
    registry: getRegistryType(secret),
  }));
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
