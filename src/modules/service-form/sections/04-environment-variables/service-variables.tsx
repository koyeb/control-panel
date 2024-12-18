import { keepPreviousData, useQuery } from '@tanstack/react-query';
import sort from 'lodash-es/sortBy';
import { useFormContext } from 'react-hook-form';

import { useApiQueryFn } from 'src/api/use-api';

import { serviceFormToDeploymentDefinition } from '../../helpers/service-form-to-deployment';
import { ServiceForm } from '../../service-form.types';

export function useServiceVariables() {
  const values = useFormContext<ServiceForm>().getValues();

  const { data } = useQuery({
    ...useApiQueryFn('getServiceVariables', {
      body: { definition: serviceFormToDeploymentDefinition(values) },
      delay: 500,
    }),
    placeholderData: keepPreviousData as never,
    refetchInterval: false,
    select: mapServiceVariables,
  });

  return data;
}

export type ServiceVariables = {
  secrets: string[];
  userEnv: string[];
  systemEnv: string[];
};

function mapServiceVariables({ secrets, system_env, user_env }: Record<string, string[]>): ServiceVariables {
  return {
    secrets: secrets!.map((name) => `secret.${name}`),
    userEnv: sort(user_env).filter((value) => value !== ''),
    systemEnv: sort(system_env),
  };
}
