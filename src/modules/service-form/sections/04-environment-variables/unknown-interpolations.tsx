import { useEffect, useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import { EnvironmentVariable } from 'src/api/model';
import { useFormValues } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

import { File, ServiceForm } from '../../service-form.types';

import { ServiceVariables, useServiceVariables } from './service-variables';

const T = createTranslate('modules.serviceForm.environmentVariables');

export function useUnknownInterpolationErrors() {
  const t = T.useTranslate();

  const { setError } = useFormContext<ServiceForm>();

  const values = useFormValues<ServiceForm>();
  const { environmentVariables, files } = values;
  const variables = useServiceVariables(values);

  const unknownInterpolations = useMemo(() => {
    if (variables === undefined) {
      return [];
    }

    return findUnknownInterpolations(variables, environmentVariables, files);
  }, [variables, environmentVariables, files]);

  useEffect(() => {
    for (const unknownInterpolation of unknownInterpolations) {
      if ('variable' in unknownInterpolation) {
        const index = environmentVariables.indexOf(unknownInterpolation.variable);

        setTimeout(() => {
          setError(`environmentVariables.${index}.value`, {
            message: t('unknownInterpolation', { value: unknownInterpolation.value }) as string,
          });
        }, 0);
      }

      if ('file' in unknownInterpolation) {
        const index = files.indexOf(unknownInterpolation.file);

        setTimeout(() => {
          setError(`files.${index}.content`, {
            message: t('unknownInterpolation', { value: unknownInterpolation.value }) as string,
          });
        }, 0);
      }
    }
  }, [t, setError, environmentVariables, files, unknownInterpolations]);
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
