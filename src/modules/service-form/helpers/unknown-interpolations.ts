import { useCallback, useRef } from 'react';
import { FieldErrors } from 'react-hook-form';

import { api } from 'src/api/api';
import { EnvironmentVariable } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';
import { assert, defined } from 'src/utils/assert';
import { wait } from 'src/utils/promises';

import { File, ServiceForm } from '../service-form.types';

import { serviceFormToDeploymentDefinition } from './service-form-to-deployment';
import { ServiceVariables, mapServiceVariables } from './service-variables';

const T = createTranslate('modules.serviceForm.errors');

export function useUnknownInterpolationErrors() {
  const t = T.useTranslate();

  const ctrl = useRef<AbortController>(null);

  return useCallback(
    async (values: ServiceForm) => {
      ctrl.current?.abort();
      ctrl.current = new AbortController();

      if (!(await wait(1000, ctrl.current.signal))) {
        return {};
      }

      const variables = mapServiceVariables(
        await api().getServiceVariables({
          body: { definition: serviceFormToDeploymentDefinition(values) },
        }),
      );

      const unknownInterpolations = findUnknownInterpolations(
        variables,
        values.environmentVariables,
        values.files,
      );

      const errors: FieldErrors<ServiceForm> = {};

      for (const unknownInterpolation of unknownInterpolations) {
        const message = t('unknownInterpolation', { value: unknownInterpolation.value });
        assert(typeof message === 'string');

        if ('variable' in unknownInterpolation) {
          const index = values.environmentVariables.indexOf(unknownInterpolation.variable);

          errors.environmentVariables ??= {};
          errors.environmentVariables[index] = {
            value: { type: 'validation', message },
          };
        }

        if ('file' in unknownInterpolation) {
          const index = values.files.indexOf(unknownInterpolation.file);

          errors.files ??= {};
          errors.files[index] = {
            content: { type: 'validation', message },
          };
        }
      }

      return errors;
    },
    [t],
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
