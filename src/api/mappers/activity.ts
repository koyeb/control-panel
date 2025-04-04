import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import { Api } from '../api-types';
import { Activity } from '../model';

export function mapActivity(activity: Api.Activity): Activity {
  return snakeToCamelDeep(requiredDeep(activity));
}
