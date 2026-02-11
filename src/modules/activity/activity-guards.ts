import { z } from 'zod';

import { createValidationGuard } from 'src/application/validation';

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
      appId: z.string(),
      appName: z.string(),
      serviceType: z.union([
        z.literal('web'),
        z.literal('worker'),
        z.literal('sandbox'),
        z.literal('database'),
      ]),
    }),
  }),
);

export const isDeploymentObject = createValidationGuard(
  z.object({
    type: z.literal('deployment'),
    metadata: z.object({
      appId: z.string(),
      appName: z.string(),
      serviceId: z.string(),
      serviceName: z.string(),
      definition: z
        .object({
          type: z.union([z.literal('WEB'), z.literal('WORKER'), z.literal('SANDBOX'), z.literal('DATABASE')]),
        })
        .optional(),
    }),
  }),
);

export const isAutoscalingActivity = createValidationGuard(
  z.object({
    verb: z.literal('autoscaled'),
    metadata: z.object({
      count: z.number(),
      previousCount: z.number(),
      region: z.string(),
    }),
    object: z.object({
      metadata: z.object({
        appId: z.string(),
        appName: z.string(),
        serviceId: z.string(),
        serviceName: z.string(),
        definition: z
          .object({
            type: z.union([
              z.literal('WEB'),
              z.literal('WORKER'),
              z.literal('SANDBOX'),
              z.literal('DATABASE'),
            ]),
          })
          .optional(),
      }),
    }),
  }),
);

export const isManuallyScaledActivity = createValidationGuard(
  z.object({
    verb: z.literal('manually-scaled'),
    metadata: z.object({
      count: z.number(),
      region: z.string(),
    }),
    object: z.object({
      id: z.string(),
      deleted: z.boolean(),
      name: z.string(),
      metadata: z.object({
        appId: z.string(),
        appName: z.string(),
        serviceType: z.union([
          z.literal('web'),
          z.literal('worker'),
          z.literal('sandbox'),
          z.literal('database'),
        ]),
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
        appName: z.string(),
        serviceId: z.string(),
        serviceName: z.string(),
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

export const isBudgetThresholdReachedActivity = createValidationGuard(
  z.object({
    object: z.object({ type: z.literal('subscription') }),
    verb: z.literal('budget_threshold_reached'),
    metadata: z.object({
      organizationName: z.string(),
      budgetAmount: z.string(),
      threshold: z.string(),
    }),
  }),
);

export const isOrganizationActivity = createValidationGuard(
  z.object({
    object: z.object({
      type: z.literal('organization'),
    }),
    metadata: z.object({
      event: z.union([
        z.literal('plan_updated'),
        z.literal('create_budget'),
        z.literal('update_budget'),
        z.literal('delete_budget'),
      ]),
    }),
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
