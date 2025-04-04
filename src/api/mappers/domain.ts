import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import type { Api } from '../api-types';
import { Domain } from '../model';

export function mapDomain(domain: Api.Domain): Domain {
  return {
    ...snakeToCamelDeep(requiredDeep(domain)),
    appId: domain.app_id === '' ? null : domain.app_id!,
    verifiedAt: domain.verified_at as string | null,
  };
}
