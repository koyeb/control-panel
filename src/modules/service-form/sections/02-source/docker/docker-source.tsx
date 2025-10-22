import { useFormContext } from 'react-hook-form';

import { useSecrets } from 'src/api';
import { openDialog } from 'src/components/dialog';
import { ControlledSelect } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';
import { Secret } from 'src/model';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

import { ServiceForm } from '../../../service-form.types';

import { DockerImageField } from './docker-image-field';

const T = createTranslate('modules.serviceForm.source.docker');

export function DockerSource() {
  const secrets = useSecrets('registry');
  const { setValue } = useFormContext<ServiceForm>();

  return (
    <>
      <DockerImageField />

      <ControlledSelect<ServiceForm, 'source.docker.registrySecret', Secret | 'none' | 'create'>
        name="source.docker.registrySecret"
        label={<T id="registrySecretLabel" />}
        tooltip={<T id="registrySecretTooltip" />}
        placeholder={<T id="registrySecretPlaceholder" />}
        items={['none', ...(secrets ?? []), 'create'] as const}
        getKey={(item) => (typeof item === 'string' ? item : item.id)}
        itemToValue={(item) => (typeof item === 'string' ? null : item.name)}
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
        onChangeEffect={(item) => {
          if (item === 'create') {
            openDialog('CreateRegistrySecret');
          }
        }}
        className="max-w-md"
      />

      <CreateRegistrySecretDialog
        onCreated={(secretName) => {
          setValue('source.docker.registrySecret', secretName, { shouldValidate: true });
        }}
      />
    </>
  );
}
