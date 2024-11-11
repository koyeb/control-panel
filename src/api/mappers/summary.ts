import { toObject } from 'src/utils/object';

import { ApiEndpointResult } from '../api';
import { ServicesSummary } from '../model';

export function mapServicesSummary({
  total,
  by_type,
  by_status,
}: ApiEndpointResult<'getServicesSummary'>): ServicesSummary {
  return {
    total: parseInt(total!),
    byType: toObject(
      Object.entries(by_type!),
      ([key]) => key,
      ([, value]) => Number(value),
    ),
    byStatus: toObject(
      Object.entries(by_status!),
      ([key]) => key,
      ([, value]) => Number(value),
    ),
  };
}
