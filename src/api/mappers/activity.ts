import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import { ApiEndpointResult } from '../api';
import { Activity } from '../model';

export function mapActivities({ activities }: ApiEndpointResult<'listActivities'>): Activity[] {
  return activities!.map((activity) => snakeToCamelDeep(requiredDeep(activity)));
}
