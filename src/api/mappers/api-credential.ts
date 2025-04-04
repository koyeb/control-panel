import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import { ApiCredential } from '../model';

export function mapApiCredential({ credentials }: ApiEndpointResult<'listApiCredentials'>): ApiCredential[] {
  return credentials!.map((credential) => ({
    ...snakeToCamelDeep(requiredDeep(credential)),
    type: lowerCase(credential.type as 'USER' | 'ORGANIZATION'),
  }));
}
