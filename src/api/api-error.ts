import { z } from 'zod';

import { UnexpectedError } from 'src/application/errors';

type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export class ApiError extends Error {
  static is(value: unknown, status?: number): value is ApiError {
    if (!(value instanceof this)) {
      return false;
    }

    return status === undefined || value.status === status;
  }

  static isValidationError(value: unknown): value is { body: z.infer<typeof apiValidationErrorSchema> } {
    return ApiError.is(value) && apiValidationErrorSchema.safeParse(value.body).success;
  }

  static isAccountLockedError(value: unknown): value is { body: z.infer<typeof accountLockedErrorSchema> } {
    return ApiError.is(value) && accountLockedErrorSchema.safeParse(value.body).success;
  }

  public readonly response: Response;
  public readonly body: ApiErrorBody;

  constructor(response: Response, body: unknown) {
    const result = apiErrorSchema.safeParse(body);

    if (!result.success) {
      throw new UnexpectedError('Unknown API error', { body });
    }

    super(result.data.message);

    this.response = response;
    this.body = result.data;
  }

  get status() {
    return this.response.status;
  }
}

const apiErrorSchema = z.looseObject({
  status: z.number(),
  code: z.string(),
  message: z.string(),
});

const apiValidationErrorSchema = apiErrorSchema.extend({
  code: z.union([
    z.literal('authorization_error'),
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

const accountLockedErrorSchema = apiErrorSchema.extend({
  status: z.literal(403),
  message: z.literal('Account is locked'),
});
