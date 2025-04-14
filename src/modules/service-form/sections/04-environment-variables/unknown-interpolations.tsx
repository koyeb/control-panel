import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { FieldErrors, Resolver } from 'react-hook-form';

import { EnvironmentVariable } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { wait } from 'src/utils/promises';

import { serviceFormToDeploymentDefinition } from '../../helpers/service-form-to-deployment';
import { File, ServiceForm } from '../../service-form.types';

import { mapServiceVariables, ServiceVariables } from './service-variables';

const T = createTranslate('modules.serviceForm.environmentVariables');

export function useUnknownInterpolationResolver() {
  const t = T.useTranslate();

  const { mutateAsync } = useMutation({
    ...useApiMutationFn('getServiceVariables', (values: ServiceForm) => ({
      body: { definition: serviceFormToDeploymentDefinition(values) },
    })),
  });

  const abort = useRef<AbortController>(null);

  return useCallback<Resolver<ServiceForm>>(
    async (values) => {
      abort.current?.abort();
      abort.current = new AbortController();

      if (!(await wait(500, abort.current.signal))) {
        return { values, errors: {} };
      }

      const { environmentVariables, files } = values;

      const unknownInterpolations = findUnknownInterpolations(
        mapServiceVariables(await mutateAsync(values)),
        environmentVariables,
        files,
      );

      const errors: FieldErrors<ServiceForm> = {};

      for (const unknownInterpolation of unknownInterpolations) {
        if ('variable' in unknownInterpolation) {
          const index = environmentVariables.indexOf(unknownInterpolation.variable);

          errors.environmentVariables ??= {};
          errors.environmentVariables[index] ??= {};

          errors.environmentVariables[index].value = {
            type: 'validation',
            message: t('unknownInterpolation', { value: unknownInterpolation.value }) as string,
          };
        }

        if ('file' in unknownInterpolation) {
          const index = files.indexOf(unknownInterpolation.file);

          errors.files ??= {};
          errors.files[index] ??= {};

          errors.files[index].content = {
            type: 'validation',
            message: t('unknownInterpolation', { value: unknownInterpolation.value }) as string,
          };
        }
      }

      return {
        values,
        errors,
      };
    },
    [mutateAsync, t],
  );
}

function findUnknownInterpolations(
  variables: ServiceVariables,
  environmentVariables: EnvironmentVariable[],
  files: File[],
): Array<{ variable: EnvironmentVariable; value: string } | { file: File; value: string }> {
  const interpolations = [...variables.secrets, ...variables.systemEnv, ...variables.userEnv];
  const result: ReturnType<typeof findUnknownInterpolations> = [];

  const findUnknownInterpolation = (value: string) => {
    for (const match of value.matchAll(/{{(((?!}}).)*)}}/g)) {
      const value = defined(match[1]).trim();

      if (!interpolations.includes(value)) {
        return value;
      }
    }
  };

  for (const variable of environmentVariables) {
    const value = findUnknownInterpolation(variable.value);

    if (value !== undefined) {
      result.push({ variable, value });
    }
  }

  for (const file of files) {
    const value = findUnknownInterpolation(file.content);

    if (value) {
      result.push({ file, value });
    }
  }

  return result;
}
