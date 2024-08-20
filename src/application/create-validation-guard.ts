import { ZodType, z } from 'zod';

export function createValidationGuard<Schema extends ZodType>(schema: Schema) {
  return (value: unknown): value is z.infer<Schema> => {
    return schema.safeParse(value).success;
  };
}

export type InferGuardType<Guard> = Guard extends (value: unknown) => value is infer T ? T : never;
