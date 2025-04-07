import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { z } from 'zod';

import { createValidationGuard } from 'src/application/create-validation-guard';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('common.validation');

export function useZodResolver<Schema extends z.Schema>(
  schema: Schema,
  ...params: Parameters<typeof useZodErrorMap>
) {
  return zodResolver(schema, {
    errorMap: useZodErrorMap(...params),
  });
}

type CustomMessage = string | React.ReactNode[];

function useZodErrorMap(
  labels: Record<string, string> = {},
  getCustomMessage?: (error: z.ZodIssueOptionalMessage) => CustomMessage | void,
): z.ZodErrorMap {
  const t = T.useTranslate();

  // @ts-expect-error using ReactElement instead of string works
  return (error, ctx): { message: CustomMessage | undefined } => {
    const path = error.path.join('.');
    const label = labels[path] ?? t('fallbackLabel', {});

    return {
      message: getMessage(error) ?? ctx.defaultError,
    };

    function getMessage(error: z.ZodIssueOptionalMessage) {
      const custom = getCustomMessage?.(error);

      if (custom) {
        return custom;
      }

      switch (error.code) {
        case z.ZodIssueCode.invalid_type:
          if (error.received === 'undefined' || error.received === 'nan') {
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
      }
    }
  };
}

const isStartsWith = createValidationGuard(z.object({ startsWith: z.string() }));
