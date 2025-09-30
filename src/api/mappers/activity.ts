import { z } from 'zod';

import { createValidationGuard } from 'src/application/validation';
import { Activity } from 'src/model';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';

import { API } from '../api-types';

export function mapActivity(activity: API.Activity): Activity {
  const result = snakeToCamelDeep(requiredDeep(activity));

  if (isDatabaseDeploymentActivity(result)) {
    // dirty fix, we'll add object.metadata.service_type = "database" to the API result
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    result.object.metadata.serviceType = 'database';
  }

  return result;
}

const isDatabaseDeploymentActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('deployment'),
      metadata: z.object({
        definition: z.object({
          database: z.object({}),
        }),
      }),
    }),
  }),
);
