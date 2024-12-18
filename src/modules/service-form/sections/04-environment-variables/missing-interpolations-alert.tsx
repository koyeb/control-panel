import { useFormContext } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { EnvironmentVariable } from 'src/api/model';
import { Translate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';

import { ServiceForm } from '../../service-form.types';

import { ServiceVariables, useServiceVariables } from './service-variables';

const T = Translate.prefix('serviceForm.environmentVariables.missingInterpolations');

export function MissingInterpolationAlert() {
  const [firstMissingInterpolation] = useMissingInterpolations();

  if (firstMissingInterpolation === undefined) {
    return null;
  }

  const [variable, value] = firstMissingInterpolation;

  return (
    <Alert
      variant="warning"
      title={<T id="title" />}
      description={<T id="description" values={{ name: variable.name, value }} />}
    />
  );
}

function useMissingInterpolations() {
  const form = useFormContext<ServiceForm>();
  const environmentVariables = form.watch('environmentVariables');
  const variables = useServiceVariables();

  if (variables === undefined) {
    return [];
  }

  return findMissingInterpolations(variables, environmentVariables);
}

function findMissingInterpolations(variables: ServiceVariables, environmentVariables: EnvironmentVariable[]) {
  const interpolations = [...variables.secrets, ...variables.systemEnv, ...variables.userEnv];
  const result: Array<[EnvironmentVariable, string]> = [];

  for (const variable of environmentVariables) {
    for (const match of variable.value.matchAll(/{{(((?!}}).)*)}}$/g)) {
      const value = defined(match[1]).trim();

      if (!interpolations.includes(value)) {
        result.push([variable, value]);
      }
    }
  }

  return result;
}
