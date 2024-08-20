import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiCredential } from '../model';

export function mapApiCredential({ credentials }: ApiEndpointResult<'listApiCredentials'>): ApiCredential[] {
  return credentials!.map((credential) => ({
    id: credential.id!,
    type: lowerCase(credential.type as 'USER' | 'ORGANIZATION'),
    name: credential.name!,
    description: credential.description! || undefined,
    createdAt: credential.created_at!,
  }));
}
