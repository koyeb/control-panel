import { useMemo } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { ServiceForm } from '../service-form.types';

import { getDeployParams } from './get-deploy-params';

export function useDeployUrl({ formState, getValues }: UseFormReturn<ServiceForm>) {
  return useMemo(() => {
    if (formState.isLoading) {
      return;
    }

    return `${window.location.origin}/deploy?${getDeployParams(getValues()).toString()}`;
  }, [formState, getValues]);
}
