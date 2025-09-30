import { ApiCredential } from 'src/model';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { API } from '../api-types';

export function mapApiCredential(credential: API.Credential): ApiCredential {
  return {
    ...snakeToCamelDeep(requiredDeep(credential)),
    type: lowerCase(credential.type as 'USER' | 'ORGANIZATION'),
  };
}
