import { useController } from 'react-hook-form';

import { useSecrets } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { Select } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';
import { hasProperty } from 'src/utils/object';

import { ServiceForm } from '../../../service-form.types';

import { DockerImageField } from './docker-image-field';

const T = createTranslate('modules.serviceForm.source.docker');

export function DockerSource() {
  const secrets = useSecrets('REGISTRY');

  const { field, fieldState } = useController<ServiceForm, 'source.docker.registrySecret'>({
    name: 'source.docker.registrySecret',
  });

  return (
    <>
      <DockerImageField />

      <Select
        ref={field.ref}
        label={<T id="registrySecretLabel" />}
        tooltip={<T id="registrySecretTooltip" />}
        placeholder={<T id="registrySecretPlaceholder" />}
        items={['none', ...(secrets ?? []), 'create'] as const}
        getKey={(item) => (typeof item === 'string' ? item : item.id)}
        itemToString={(item) => (typeof item === 'string' ? item : item.name)}
        renderItem={(item: 'none' | 'create' | Secret) => {
          if (item === 'none') {
            return <T id="noRegistrySecret" />;
          }

          if (item === 'create') {
            return <T id="createRegistrySecret" />;
          }

          return item.name;
        }}
        value={secrets?.find(hasProperty('name', field.value)) ?? null}
        onChange={(item) => {
          if (item === 'create') {
            openDialog('CreateRegistrySecret');
          } else if (item === 'none') {
            field.onChange(null);
          } else {
            field.onChange(item.name);
          }
        }}
        invalid={fieldState.invalid}
        helperText={fieldState.error?.message}
        className="max-w-md"
      />

      <CreateRegistrySecretDialog onCreated={field.onChange} />
    </>
  );
}
