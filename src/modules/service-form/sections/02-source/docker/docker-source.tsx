import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSecrets } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { ControlledSelect } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

import { ServiceForm } from '../../../service-form.types';

import { DockerImageField } from './docker-image-field';

const T = createTranslate('serviceForm.source.docker');

export function DockerSource() {
  const { setValue } = useFormContext<ServiceForm>();

  const secrets = useSecrets('registry');

  const [registryDialogOpen, setRegistryDialogOpen] = useState(false);

  return (
    <>
      <DockerImageField />

      <ControlledSelect<ServiceForm, 'source.docker.registrySecret', Secret | 'none' | 'create'>
        name="source.docker.registrySecret"
        label={<T id="registrySecretLabel" />}
        helpTooltip={<T id="registrySecretTooltip" />}
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
            return setRegistryDialogOpen(true);
          }
        }}
        className="max-w-md"
      />

      <CreateRegistrySecretDialog
        isOpen={registryDialogOpen}
        onClose={() => setRegistryDialogOpen(false)}
        onCreated={(secretName) => {
          setValue('source.docker.registrySecret', secretName, { shouldValidate: true });
          setRegistryDialogOpen(false);
        }}
      />
    </>
  );
}
