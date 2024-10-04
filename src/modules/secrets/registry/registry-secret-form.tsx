import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { FieldValues, FormState, Path, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { api, ApiEndpointParams } from 'src/api/api';
import { RegistrySecret, type RegistryType } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { readFile } from 'src/application/read-file';
import { useToken } from 'src/application/token';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { useFormErrorHandler } from 'src/hooks/form';
import { useUpdateEffect } from 'src/hooks/lifecycle';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { RegistryType as RegistryTypeComponent } from './registry-type';

const T = Translate.prefix('secrets.registrySecretForm');

const schema = z.object({
  name: z.string().min(2),
  type: z.union([
    z.literal('docker-hub'),
    z.literal('digital-ocean'),
    z.literal('github'),
    z.literal('gitlab'),
    z.literal('azure'),
    z.literal('gcp'),
    z.literal('private'),
  ]),
  username: z.string(),
  password: z.string(),
  registryName: z.string(),
  registryUrl: z.string(),
  keyFile: z.string(),
});

const registries = [
  'docker-hub',
  'digital-ocean',
  'github',
  'gitlab',
  'azure',
  'gcp',
  'private',
] satisfies RegistryType[];

type RegistrySecretFormProps = {
  secret?: RegistrySecret;
  renderFooter: (formState: FormState<FieldValues>) => React.ReactNode;
  onSubmitted: (secretName: string) => void;
};

export function RegistrySecretForm({ secret, renderFooter, onSubmitted }: RegistrySecretFormProps) {
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: secret?.name ?? '',
      username: '',
      password: '',
      type: secret?.registry,
      registryName: '',
      registryUrl: '',
      keyFile: '',
    },
    resolver: useZodResolver(schema, {
      name: t('nameLabel'),
      username: t('usernameLabel'),
      password: t('passwordLabel'),
      type: t('typeLabel'),
      registryName: t('registryNameLabel'),
      registryUrl: t('registryUrlLabel'),
    }),
  });

  useUpdateEffect(() => {
    if (secret) {
      form.reset({ name: secret.name, type: secret.registry });
    }
  }, [form, secret]);

  const invalidate = useInvalidateApiQuery();
  const { token } = useToken();

  const { mutateAsync: createSecret } = useMutation({
    async mutationFn(values: z.infer<typeof schema>) {
      if (secret) {
        return api.updateSecret({
          token,
          path: { id: secret.id },
          query: {},
          body: getSecretPayload(values),
        });
      } else {
        return api.createSecret({
          token,
          body: getSecretPayload(values),
        });
      }
    },
    onSuccess({ secret }) {
      void invalidate('listSecrets');
      form.reset();
      onSubmitted(secret!.name!);
    },
    onError: useFormErrorHandler(form, mapError),
  });

  const type = form.watch('type');
  const errors = form.formState.errors;
  const firstError = Object.keys(errors)[0] as Path<z.infer<typeof schema>> | undefined;

  useEffect(() => {
    if (firstError !== undefined) {
      form.setFocus(firstError);
    }
  }, [form, firstError]);

  return (
    <form
      className="col gap-3"
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={(event) => {
        // avoid submitting the service form
        event.stopPropagation();
        return form.handleSubmit((values) => createSecret(values))(event);
      }}
    >
      <ControlledInput
        control={form.control}
        name="name"
        required
        readOnly={secret !== undefined}
        label={<T id="nameLabel" />}
        placeholder={t('namePlaceholder')}
      />

      <ControlledSelect
        control={form.control}
        name="type"
        label={<T id="typeLabel" />}
        placeholder={t('typePlaceholder')}
        items={registries}
        getKey={identity}
        itemToString={identity}
        itemToValue={identity}
        renderItem={(registry) => <RegistryTypeComponent registry={registry} />}
      />

      {type !== 'gcp' && (
        <ControlledInput
          control={form.control}
          name="username"
          required
          label={<T id="usernameLabel" />}
          placeholder={t('usernamePlaceholder')}
        />
      )}

      {type !== 'gcp' && (
        <ControlledInput
          control={form.control}
          type="password"
          name="password"
          required
          label={<T id="passwordLabel" />}
          placeholder={t('passwordPlaceholder')}
          // prevent chrome autofill
          autoComplete="one-time-code"
        />
      )}

      {type === 'azure' && (
        <ControlledInput
          control={form.control}
          name="registryName"
          required
          label={<T id="registryNameLabel" />}
          placeholder={t('registryNamePlaceholder')}
        />
      )}

      {['gcp', 'private'].includes(type) && (
        <ControlledInput
          control={form.control}
          label={<T id="registryUrlLabel" />}
          placeholder={t('registryUrlPlaceholder')}
          name="registryUrl"
          required
          error={errors.registryUrl?.message}
        />
      )}

      {type === 'gcp' && (
        <KeyFileUpload
          error={errors.keyFile?.message}
          onChange={(value) => form.setValue('keyFile', value, { shouldValidate: true })}
        />
      )}

      {renderFooter(form.formState)}
    </form>
  );
}

type KeyFileUploadProps = {
  error: string | undefined;
  onChange: (value: string) => void;
};

function KeyFileUpload({ error, onChange }: KeyFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');

  return (
    <div className="row items-center gap-4">
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <T id="uploadKeyFile" />
      </Button>

      <p className="text-dim">{fileName ? <T id="keyFile" values={{ fileName }} /> : <T id="noKeyFile" />}</p>

      {error && <p className="text-red">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={({ target }) => {
          const file = target.files?.[0];

          const handleFile = ({ file, content }: { file: File; content: string }) => {
            setFileName(file.name);
            onChange(btoa(content));
          };

          if (file) {
            // eslint-disable-next-line no-console
            void readFile(file).then(handleFile, console.error);
          }
        }}
      />
    </div>
  );
}

function getSecretPayload(values: z.infer<typeof schema>) {
  const payload: ApiEndpointParams<'createSecret'>['body'] = {
    name: values.name,
    type: 'REGISTRY',
  };

  if (values.type === 'docker-hub') {
    payload.docker_hub_registry = {
      username: values.username,
      password: values.password,
    };
  }

  if (values.type === 'digital-ocean') {
    payload.digital_ocean_registry = {
      username: values.username,
      password: values.password,
    };
  }

  if (values.type === 'github') {
    payload.github_registry = {
      username: values.username,
      password: values.password,
    };
  }

  if (values.type === 'gitlab') {
    payload.gitlab_registry = {
      username: values.username,
      password: values.password,
    };
  }

  if (values.type === 'azure') {
    payload.azure_container_registry = {
      username: values.username,
      password: values.password,
      registry_name: values.registryName,
    };
  }

  if (values.type === 'gcp') {
    payload.gcp_container_registry = {
      // cspell:word keyfile
      keyfile_content: values.keyFile,
      url: values.registryUrl,
    };
  }

  if (values.type === 'private') {
    payload.private_registry = {
      username: values.username,
      password: values.password,
      url: values.registryUrl,
    };
  }

  return payload;
}

function mapError(error: Record<string, string>) {
  for (const [key, value] of Object.entries(error)) {
    if (key.endsWith('username')) {
      error.username = value;
      delete error[key];
    }

    if (key.endsWith('password')) {
      error.password = value;
      delete error[key];
    }

    if (key.endsWith('url')) {
      error.registryUrl = value;
      delete error[key];
    }

    if (key.endsWith('registry_name')) {
      error.registryName = value;
      delete error[key];
    }

    if (key.endsWith('keyfile_content')) {
      error.keyFile = value;
      delete error[key];
    }
  }

  return error;
}
