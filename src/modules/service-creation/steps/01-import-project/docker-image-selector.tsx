import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useEffect } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSecrets } from 'src/api/hooks/secret';
import { Secret } from 'src/api/model';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { Dialog } from 'src/components/dialog';
import { DockerImageHelperText } from 'src/components/docker-image-input/docker-image-helper-text';
import { useVerifyDockerImage } from 'src/components/docker-image-input/use-verify-docker-image';
import { handleSubmit } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

const T = createTranslate('modules.serviceCreation.importProject.docker');

const schema = z.object({
  image: z.string().min(1),
  registrySecret: z.string().nullable(),
});

type DockerImageSelectorProps = {
  onSelected: (image: string, secretName: string | null) => void;
};

export function DockerImageSelector({ onSelected }: DockerImageSelectorProps) {
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      image: '',
      registrySecret: null,
    },
    resolver: zodResolver(schema),
  });

  const { verifying, verified, error, retry } = useVerifyDockerImage(
    form.watch('image'),
    form.watch('registrySecret') ?? undefined,
  );

  useEffect(() => {
    if (verifying) {
      form.clearErrors('image');
    } else if (error) {
      form.setError('image', error);
    }
  }, [verifying, error, form]);

  return (
    <form
      className="col gap-8"
      onSubmit={handleSubmit(form, ({ image, registrySecret }) => onSelected(image, registrySecret))}
    >
      <div className="text-base font-medium">
        <T id="title" />
      </div>

      <div className="col gap-6">
        <div className="col gap-2 sm:row sm:gap-8">
          <div className="col w-full max-w-96 gap-2">
            <div className="font-medium">
              <T id="imageFieldLabel" />
            </div>
            <div className="text-dim">
              <T id="imageFieldDescription" />
            </div>
          </div>

          <ControlledInput
            control={form.control}
            name="image"
            autoFocus
            className="w-full max-w-xs"
            placeholder={t('imagePlaceholder')}
            helperText={
              <DockerImageHelperText
                verifying={verifying}
                verified={verified}
                error={form.formState.errors.image}
                onRetry={retry}
              />
            }
          />
        </div>

        <div className="col gap-2 sm:row sm:gap-8">
          <div className="col w-full max-w-96 gap-2">
            <div className="font-medium">
              <T id="registryFieldLabel" />
            </div>
            <div className="text-dim">
              <T id="registryFieldDescription" />
            </div>
          </div>

          <RegistrySecretField form={form} />
        </div>
      </div>

      <Button type="submit" disabled={!verified} className="self-start">
        <Translate id="common.next" />
      </Button>
    </form>
  );
}

type RegistrySecretFieldProps = {
  form: UseFormReturn<z.infer<typeof schema>>;
};

function RegistrySecretField({ form }: RegistrySecretFieldProps) {
  const openDialog = Dialog.useOpen();
  const registrySecrets = useSecrets('registry');

  return (
    <>
      <ControlledSelect
        control={form.control}
        name="registrySecret"
        placeholder={<T id="registryFieldPlaceholder" />}
        items={['none', ...(registrySecrets ?? []), 'create'] as const}
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
        className="w-full max-w-xs"
      />

      <CreateRegistrySecretDialog
        onCreated={(secretName) => form.setValue('registrySecret', secretName, { shouldValidate: true })}
      />
    </>
  );
}
