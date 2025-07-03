import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSecrets } from 'src/api/hooks/secret';
import { ControlledInput, ControlledSelect, ControlledSwitch } from 'src/components/controlled';
import { DockerImageHelperText } from 'src/components/docker-image-input/docker-image-helper-text';
import { useVerifyDockerImage } from 'src/components/docker-image-input/use-verify-docker-image';
import { IconArrowRight } from 'src/components/icons';
import { handleSubmit } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { getId, getName } from 'src/utils/object';

import { useCreateServiceDialog } from '../use-create-service-dialog';

const T = createTranslate('modules.createServiceDialog');

const schema = z.object({
  image: z.string().min(1),
  private: z.boolean(),
  registrySecret: z.string().nullable(),
});

export function DockerImageSelection() {
  const { serviceType, closeDialog } = useCreateServiceDialog();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      image: '',
      private: false,
      registrySecret: null,
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = (image: string, secretName: string | null) => {
    if (secretName !== null) {
      // todo: remove
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (window as any).__KOYEB_REGISTRY_SECRET_HACK = secretName;
    }

    closeDialog();

    navigate({
      to: '/services/deploy',
      search: { service_type: serviceType, type: 'docker', image },
    });
  };

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

  const registrySecrets = useSecrets('registry');

  return (
    <div className="col p-2">
      <form
        className="col gap-4 p-3"
        onSubmit={handleSubmit(form, ({ image, registrySecret }) => onSubmit(image, registrySecret))}
      >
        <ControlledInput
          control={form.control}
          name="image"
          autoFocus
          label={<T id="dockerImagePath" />}
          helperText={
            <DockerImageHelperText
              verifying={verifying}
              verified={verified}
              error={form.formState.errors.image}
              onRetry={retry}
            />
          }
        />

        <div className="row items-center gap-4">
          <ControlledSwitch
            control={form.control}
            label={<T id="privateImage" />}
            name="private"
            onChangeEffect={() => form.setValue('registrySecret', null)}
          />

          <ControlledSelect
            control={form.control}
            name="registrySecret"
            label={<T id="registryConfigurationLabel" />}
            items={registrySecrets ?? []}
            getKey={getId}
            itemToValue={getName}
            itemToString={getName}
            renderItem={getName}
            renderNoItems={() => <T id="noRegistrySecrets" />}
            disabled={form.watch('private') === false}
            className="w-full"
          />
        </div>

        <Button type="submit" disabled={!verified} className="self-start">
          <T id="deployImage" />
          <IconArrowRight className="size-icon" />
        </Button>
      </form>

      <p className="mt-auto text-xs text-dim">
        <T
          id="createRegistrySecret"
          values={{
            link: (children) => (
              <button
                role="link"
                className="text-link"
                onClick={() => navigate({ to: '/secrets', search: { create: true } })}
              >
                {children}
              </button>
            ),
          }}
        />
      </p>
    </div>
  );
}
