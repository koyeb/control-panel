import { useFormContext } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { EnvironmentVariable } from 'src/api/model';
import { createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

import { File, ServiceForm } from '../../service-form.types';

import { ServiceVariables, useServiceVariables } from './service-variables';

const T = createTranslate('modules.serviceForm.environmentVariables.unknownInterpolation');

export function UnknownInterpolationAlert() {
  const result = useUnknownInterpolations();

  if (result === undefined) {
    return null;
  }

  return (
    <Alert
      variant="warning"
      title={<T id="title" />}
      description={
        <T
          id="description"
          values={
            result.variable
              ? { type: 'variable', name: result.variable.name, value: result.value }
              : { type: 'file', name: result.file.mountPath, value: result.value }
          }
        />
      }
    />
  );
}

function useUnknownInterpolations() {
  const form = useFormContext<ServiceForm>();
  const environmentVariables = form.watch('environmentVariables');
  const files = form.watch('files');
  const variables = useServiceVariables();

  if (variables !== undefined) {
    return findUnknownInterpolations(variables, environmentVariables, files);
  }
}

function findUnknownInterpolations(
  variables: ServiceVariables,
  environmentVariables: EnvironmentVariable[],
  files: File[],
) {
  const interpolations = [...variables.secrets, ...variables.systemEnv, ...variables.userEnv];

  const findUnknownInterpolation = (value: string) => {
    for (const match of value.matchAll(/{{(((?!}}).)*)}}$/g)) {
      const value = defined(match[1]).trim();

      if (!interpolations.includes(value)) {
        return value;
      }
    }
  };

  for (const variable of environmentVariables) {
    const value = findUnknownInterpolation(variable.value);

    if (value) {
      return { variable, value };
    }
  }

  for (const file of files) {
    const value = findUnknownInterpolation(file.content);

    if (value) {
      return { file, value };
    }
  }
}
