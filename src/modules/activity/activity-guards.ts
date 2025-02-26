import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';

export const isDomainObject = createValidationGuard(
  z.object({
    type: z.literal('domain'),
  }),
);

export const isSecretObject = createValidationGuard(
  z.object({
    type: z.literal('secret'),
  }),
);

export const isServiceObject = createValidationGuard(
  z.object({
    type: z.literal('service'),
    metadata: z.object({
      app_id: z.string(),
      app_name: z.string(),
      service_type: z.union([z.literal('web'), z.literal('worker'), z.literal('database')]),
    }),
  }),
);

export const isDeploymentObject = createValidationGuard(
  z.object({
    type: z.literal('deployment'),
    metadata: z.object({
      app_id: z.string(),
      app_name: z.string(),
      service_id: z.string(),
      service_name: z.string(),
    }),
  }),
);

export const isAutoscalingActivity = createValidationGuard(
  z.object({
    verb: z.literal('autoscaled'),
    metadata: z.object({
      count: z.number(),
      previous_count: z.number(),
      region: z.string(),
    }),
    object: z.object({
      metadata: z.object({
        app_id: z.string(),
        app_name: z.string(),
        service_id: z.string(),
        service_name: z.string(),
      }),
    }),
  }),
);

export const isInvitationObject = createValidationGuard(
  z.object({
    type: z.literal('organization_invitation'),
    metadata: z.object({
      email: z.string(),
    }),
  }),
);

export const isAppActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('app'),
    }),
  }),
);

export const isDeploymentActivity = createValidationGuard(
  z.object({
    metadata: z.object({
      messages: z.array(z.string()),
    }),
    object: z.object({
      type: z.literal('deployment'),
    }),
  }),
);

export const isVolumeActivity = createValidationGuard(
  z.object({
    metadata: z
      .object({
        app_name: z.string(),
        service_id: z.string(),
        service_name: z.string(),
      })
      .partial(),
    object: z.object({
      type: z.literal('persistent_volume'),
      name: z.string(),
    }),
  }),
);

export const isSessionActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('session'),
    }),
  }),
);

export const isSubscriptionActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('subscription'),
      metadata: z.object({
        trial: z.boolean().optional(),
        plan: z
          .union([
            z.literal('hobby'),
            z.literal('starter'),
            z.literal('pro'),
            z.literal('scale'),
            z.literal('enterprise'),
          ])
          .optional(),
      }),
    }),
  }),
);

export const isOrganizationActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('organization'),
    }),
    metadata: z
      .object({
        event: z.literal('plan_updated'),
      })
      .optional(),
  }),
);

export const isOrganizationInvitationActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('organization_invitation'),
    }),
  }),
);

export const isOrganizationMemberActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('organization_member'),
    }),
  }),
);
