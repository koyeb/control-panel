import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';

import { ApiEndpointResult } from '../api';
import { Activity } from '../model';

export function mapActivities({ activities }: ApiEndpointResult<'listActivities'>): Activity[] {
  return activities!.map((activity) => ({
    id: activity.id!,
    date: activity.created_at!,
    verb: activity.verb!,
    tokenId: isCredentialActivity(activity)
      ? activity.metadata.auth_token_ref.replace(/^credential:/, '')
      : undefined,
    actor: {
      name: activity.actor!.name!,
      type: activity.actor!.type!,
      metadata: activity.actor!.metadata!,
    },
    object: {
      id: activity.object!.id!,
      name: activity.object!.name!,
      type: activity.object!.type!,
      deleted: activity.object!.deleted!,
      metadata: activity.object!.metadata!,
    },
    metadata: activity.metadata!,
  }));
}

const isCredentialActivity = createValidationGuard(
  z.object({
    metadata: z.object({
      auth_token_ref: z.string().startsWith('credential:'),
    }),
  }),
);
