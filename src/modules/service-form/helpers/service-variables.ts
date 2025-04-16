import { useQuery } from '@tanstack/react-query';
import sort from 'lodash-es/sortBy';
import { useCallback } from 'react';

import { useApiQueryFn } from 'src/api/use-api';

import { ServiceForm } from '../service-form.types';

export function useServiceVariables() {
  const query = useQuery({
    ...useApiQueryFn('getServiceVariables', { body: { definition: {} } }),
    refetchInterval: false,
  });

  return useCallback(
    (values?: ServiceForm) => {
      return mapServiceVariables({
        secrets: query.data?.secrets,
        system_env: query.data?.system_env,
        user_env: values?.environmentVariables.map(({ name }) => name),
      });
    },
    [query.data],
  );
}

export type ServiceVariables = {
  secrets: string[];
  userEnv: string[];
  systemEnv: string[];
};

function mapServiceVariables({
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
