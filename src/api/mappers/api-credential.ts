import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import { Api } from '../api-types';
import { ApiCredential } from '../model';

export function mapApiCredential(credential: Api.Credential): ApiCredential {
  return {
    ...snakeToCamelDeep(requiredDeep(credential)),
    type: lowerCase(credential.type as 'USER' | 'ORGANIZATION'),
  };
}
