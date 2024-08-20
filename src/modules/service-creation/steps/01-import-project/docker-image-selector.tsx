import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useSecrets } from 'src/api/hooks/secret';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { DockerImageHelperText } from 'src/components/docker-image-input/docker-image-helper-text';
import { useVerifyDockerImage } from 'src/components/docker-image-input/use-verify-docker-image';
import { handleSubmit } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';
import { CreateRegistrySecretDialog } from 'src/modules/secrets/registry/create-registry-secret-dialog';

const T = Translate.prefix('serviceCreation.importProject.docker');

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
        <div className="col sm:row gap-2 sm:gap-8">
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

        <div className="col sm:row gap-2 sm:gap-8">
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
  const [createSecretDialogOpen, setCreateSecretDialogOpen] = useState(false);
  const registrySecrets = useSecrets('registry');

  return (
    <>
      <ControlledSelect
        control={form.control}
        name="registrySecret"
        placeholder={<T id="registryFieldPlaceholder" />}
        items={['none', ...(registrySecrets ?? [])] as const}
        getKey={(item) => (item === 'none' ? 'none' : item.id)}
        itemToValue={(item) => (item === 'none' ? null : item.name)}
        itemToString={(item) => (item === 'none' ? '' : item.name)}
        renderItem={(item) => (item === 'none' ? <T id="noRegistrySecret" /> : item.name)}
        onCreateItem={() => setCreateSecretDialogOpen(true)}
        renderCreateItem={() => <T id="createRegistrySecret" />}
        className="w-full max-w-xs"
      />

      <CreateRegistrySecretDialog
        isOpen={createSecretDialogOpen}
        onClose={() => setCreateSecretDialogOpen(false)}
        onCreated={(secretName) => {
          form.setValue('registrySecret', secretName, { shouldValidate: true });
          setCreateSecretDialogOpen(false);
        }}
      />
    </>
  );
}
