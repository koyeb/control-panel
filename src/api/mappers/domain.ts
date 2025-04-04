import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { Api } from '../api-types';
import { Domain } from '../model';

export function mapDomain(domain: Api.Domain): Domain {
  return {
    ...snakeToCamelDeep(requiredDeep(domain)),
    appId: domain.app_id === '' ? null : domain.app_id!,
    type: lowerCase(domain.type!),
    status: lowerCase(domain.status!),
    verifiedAt: domain.verified_at as string | null,
  };
}
