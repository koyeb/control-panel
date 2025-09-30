import { useQuery } from '@tanstack/react-query';
import sort from 'lodash-es/sortBy';

import { apiQuery } from 'src/api';
import { useDebouncedValue } from 'src/hooks/timers';

import { ServiceForm } from '../service-form.types';

import { serviceFormToDeploymentDefinition } from './service-form-to-deployment';

export function useServiceVariables(values: ServiceForm) {
  const valuesDebounced = useDebouncedValue(values, 1000);

  const query = useQuery({
    ...apiQuery('post /v1/services-autocomplete', {
      body: { definition: serviceFormToDeploymentDefinition(valuesDebounced) },
    }),
    refetchInterval: false,
    select: mapServiceVariables,
  });

  return query.data;
}

export type ServiceVariables = {
  secrets: string[];
  userEnv: string[];
  systemEnv: string[];
};

export function mapServiceVariables({
  secrets = [],
  system_env = [],
  user_env = [],
}: Partial<Record<string, string[]>>): ServiceVariables {
  return {
    secrets: secrets.map((name) => `secret.${name}`),
    userEnv: sort(user_env).filter((value) => value !== ''),
    systemEnv: sort(system_env),
  };
}
