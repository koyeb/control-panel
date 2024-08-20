import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import { slugify } from 'src/utils/strings';

import { ServiceForm } from '../../service-form.types';

export function useGenerateServiceName() {
  const { getValues, setValue } = useFormContext<ServiceForm>();

  return useCallback(() => {
    const values = getValues();

    if (values.meta?.serviceId) {
      return;
    }

    const serviceName = generateServiceName(values);

    if (serviceName && serviceName !== values.serviceName) {
      setValue('serviceName', serviceName, { shouldValidate: true });
    }
  }, [getValues, setValue]);
}

export function generateServiceName(values: ServiceForm) {
  const source = values.source;
  const repository = source.git[`${source.git.repositoryType}Repository`];

  let name: string | undefined = undefined;

  if (source.type === 'git' && repository.repositoryName) {
    name = repository.repositoryName;
  }

  if (source.type === 'docker') {
    name = source.docker.image.replace(/:.+$/, '');
  }

  if (name !== undefined) {
    return slugify(name.replace(/.*\//, ''));
  }
}
