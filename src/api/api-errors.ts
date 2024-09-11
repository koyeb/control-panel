import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';

const apiResponseSchema = z.object({
  body: z.object({
    status: z.number(),
  }),
});

export const isApiResponse = createValidationGuard(apiResponseSchema);

const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string({}),
  status: z.number({}),
});

type ApiErrorType = z.infer<typeof apiErrorSchema>;
export const isApiError = createValidationGuard(apiErrorSchema);

export const isApiNotFoundError = createValidationGuard(
  apiErrorSchema.extend({
    code: z.literal('not_found'),
  }),
);

export const isApiFailedPrecondition = createValidationGuard(
  apiErrorSchema.extend({
    code: z.literal('failed_precondition'),
  }),
);

export const isAccountLockedError = createValidationGuard(
  z.object({
    status: z.literal(403),
    message: z.literal('Account is locked'),
  }),
);

const apiValidationErrorSchema = apiErrorSchema.extend({
  code: z.union([
    z.literal('invalid_argument'),
    z.literal('invalid_parameter'),
    z.literal('failed_precondition'),
  ]),
  fields: z.array(
    z.object({
      field: z.string(),
      description: z.string(),
    }),
  ),
});

type ApiValidationErrorType = z.infer<typeof apiValidationErrorSchema>;
export const isApiValidationError = createValidationGuard(apiValidationErrorSchema);

const objectWithMessageSchema = z.object({
  message: z.string(),
});

export const hasMessage = createValidationGuard(objectWithMessageSchema);

export class ApiError extends Error {
  constructor(public readonly body: ApiErrorType) {
    super(body.message);
  }

  get code() {
    return this.body.code;
  }

  get status() {
    return this.body.status;
  }
}

export class ApiValidationError extends ApiError {
  static schema = apiValidationErrorSchema;

  constructor(public readonly body: ApiValidationErrorType) {
    super(body);
  }

  get fields() {
    return this.body.fields;
  }
}
