import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('common.validation');

export function useZodResolver<Schema extends z.Schema>(
  schema: Schema,
  ...params: Parameters<typeof useZodErrorMap>
) {
  return zodResolver(schema, {
    errorMap: useZodErrorMap(...params),
  });
}

function useZodErrorMap(
  labels: Record<string, string> = {},
  custom?: (refinement: string | undefined, error: z.ZodCustomIssue) => string | void,
): z.ZodErrorMap {
  const translate = T.useTranslate();

  const t = (...params: Parameters<typeof translate>): string => {
    // @ts-expect-error using React.Element instead of string works
    return translate(...params);
  };

  return (error, ctx) => {
    const path = error.path.join('.');
    const label = labels[path] ?? t('fallbackLabel', {});

    return { message: getMessage(error) ?? ctx.defaultError };

    function getMessage(error: z.ZodIssueOptionalMessage): string | void {
      switch (error.code) {
        case z.ZodIssueCode.invalid_type:
          if (error.received === 'undefined') {
            return t('required', { label });
          }
          break;

        case z.ZodIssueCode.too_small:
          return t(error.type === 'string' ? 'minLength' : 'min', { label, min: error.minimum as number });

        case z.ZodIssueCode.too_big:
          return t(error.type === 'string' ? 'maxLength' : 'max', { label, max: error.maximum as number });

        case z.ZodIssueCode.invalid_string:
          if (error.validation === 'email') {
            return t('email', { label });
          }

          if (isStartsWith(error.validation)) {
            return t('startsWith', { label, startsWith: error.validation.startsWith });
          }

          break;

        case z.ZodIssueCode.custom:
          return getCustomMessage(error);
      }
    }

    function getCustomMessage(error: z.ZodCustomIssue): string | void {
      const { refinement } = (error.params ?? {}) as { refinement?: string };

      if (refinement === 'isSlug') {
        return t('slug', { label });
      }

      return custom?.(refinement, error);
    }
  };
}

const isStartsWith = createValidationGuard(z.object({ startsWith: z.string() }));
