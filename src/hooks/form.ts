import cloneDeep from 'lodash-es/cloneDeep';
import { useCallback } from 'react';
import {
  FieldErrors,
  FieldPath,
  FieldValues,
  UseFormReturn,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import { ApiError, hasMessage } from 'src/api/api-errors';
import { notify } from 'src/application/notify';
import { reportError } from 'src/application/sentry';
import { useTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { toObject } from 'src/utils/object';

import { useDeepCompareMemo } from './lifecycle';

export type FormValues<Form> = Form extends UseFormReturn<infer Values> ? Values : never;

// helper for https://github.com/orgs/react-hook-form/discussions/10965
export function handleSubmit<Values extends FieldValues>(
  form: UseFormReturn<Values>,
  onValid: (values: Values) => unknown,
  onInvalid?: (errors: FieldErrors<Values>) => unknown,
): React.FormEventHandler {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return form.handleSubmit(
    // catch async errors to avoid reporting to sentry
    (values) => Promise.resolve(onValid(values)).catch(() => {}),
    (errors) => onInvalid?.(errors),
  );
}

export const useFormErrorHandler = <Values extends FieldValues>(
  form: UseFormReturn<Values>,
  map: (error: Record<string, string>) => Record<string, string | undefined> = identity,
) => {
  const translate = useTranslate();
  const { setError } = form;

  return useCallback(
    (error: unknown) => {
      const message = hasMessage(error) && error.message;

      if (!ApiError.is(error)) {
        notify.error(message || translate('common.unknownError'));
        reportError(error);
        return;
      }

      if (!ApiError.isValidationError(error)) {
        notify.error(message || translate('common.apiError'));
        return;
      }

      const fields = map(
        toObject(
          error.body.fields,
          ({ field }) => field,
          ({ description }) => description,
        ),
      );

      for (const [fieldName, message] of Object.entries(fields)) {
        if (message !== undefined) {
          setError(fieldName as FieldPath<Values>, { message });
        }
      }
    },
    [translate, setError, map],
  );
};

// https://react-hook-form.com/docs/usewatch
export const useFormValues = <Values extends FieldValues>(form?: UseFormReturn<Values>): Values => {
  const formContext = useFormContext<Values>();

  if (form === undefined) {
    form = formContext;
  }

  // return new references to trigger memoization effects on change
  const values = cloneDeep({
    ...useWatch({ control: form.control }),
    ...form.getValues(),
  });

  return useDeepCompareMemo(values);
};
