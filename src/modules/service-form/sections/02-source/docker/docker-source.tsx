import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSecrets } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { ControlledSelect } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

import { ServiceForm } from '../../../service-form.types';

import { DockerImageField } from './docker-image-field';

const T = Translate.prefix('serviceForm.source.docker');

export function DockerSource() {
  const { setValue } = useFormContext<ServiceForm>();

  const secrets = useSecrets('registry');

  const [registryDialogOpen, setRegistryDialogOpen] = useState(false);

  return (
    <>
      <DockerImageField />

      <ControlledSelect<ServiceForm, 'source.docker.registrySecret', Secret | 'none'>
        name="source.docker.registrySecret"
        label={<T id="registrySecretLabel" />}
        helpTooltip={<T id="registrySecretTooltip" />}
        placeholder={<T id="registrySecretPlaceholder" />}
        items={['none', ...(secrets ?? [])] as const}
        getKey={(item) => (item === 'none' ? 'none' : item.id)}
        itemToValue={(item) => (item === 'none' ? null : item.name)}
        itemToString={(item) => (item === 'none' ? '' : item.name)}
        renderItem={(item) => (item === 'none' ? <T id="noRegistrySecret" /> : item.name)}
        onCreateItem={() => setRegistryDialogOpen(true)}
        renderCreateItem={() => <T id="createRegistrySecret" />}
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
