import { ZodType, z } from 'zod';

import { TranslateFn } from 'src/intl/translate';

export function createValidationGuard<Schema extends ZodType>(schema: Schema) {
  return (value: unknown): value is z.infer<Schema> => {
    return schema.safeParse(value).success;
  };
}

export const hasMessage = createValidationGuard(z.object({ message: z.string() }));

export function configureZod(translate: TranslateFn) {
  z.config({
    customError: (iss) => {
      if (iss.input === undefined || Number.isNaN(iss.input)) {
        return translate('validation.required');
      }

      if (iss.expected === 'int') {
        return translate('validation.integer');
      }

      if (iss.code === 'invalid_format') {
        if (iss.format === 'email') {
          return translate('validation.email');
        }

        if (iss.format === 'starts_with') {
          return translate('validation.startsWith', { prefix: iss.prefix as string }) as string;
        }
      }

      if (iss.code === 'too_small') {
        if (iss.origin === 'string') {
          return translate('validation.minLength', { min: iss.minimum }) as string;
        } else {
          return translate('validation.min', { min: iss.minimum }) as string;
        }
      }

      if (iss.code === 'too_big') {
        if (iss.origin === 'string') {
          return translate('validation.maxLength', { max: iss.maximum }) as string;
        } else {
          return translate('validation.max', { max: iss.maximum }) as string;
        }
      }

      if (iss.code === 'custom' && iss.params?.refinement === 'isSlug') {
        return translate('validation.slug');
      }

      return iss.message;
    },
  });
}
