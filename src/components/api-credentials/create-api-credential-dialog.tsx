import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog, Input } from '@koyeb/design-system';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { ApiCredential } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { CopyIconButton } from 'src/application/copy-icon-button';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { upperCase } from 'src/utils/strings';

type CreateApiCredentialProps = {
  type: ApiCredential['type'];
  open: boolean;
  onClose: () => void;
};

export function CreateApiCredentialDialog({ type, open, onClose }: CreateApiCredentialProps) {
  const T = Translate.prefix(`pages.${type}Settings.apiCredential`);
  const user = useUser();
  const organization = useOrganization();
  const [created, setCreated] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Dialog
        isOpen={open && created === undefined}
        onClose={onClose}
        width="lg"
        title={<T id="createDialog.title" />}
        description={
          <T
            id="createDialog.description"
            values={{ organizationName: organization.name, userName: user.name }}
          />
        }
      >
        <CreateApiCredentialForm
          type={type}
          onCancel={onClose}
          onCreated={(created) => {
            setCreated(created);
            onClose();
          }}
        />
      </Dialog>

      <Dialog
        isOpen={created !== undefined}
        onClose={() => setCreated(undefined)}
        width="lg"
        title={<T id="createDialog.createdTitle" />}
        description={<T id="createDialog.createdDescription" />}
        className="col gap-4"
      >
        <Input
          ref={inputRef}
          value={created ?? ''}
          readOnly
          end={<CopyIconButton text={created!} className="mx-2 size-4 self-center" />}
          onClick={() => inputRef.current?.select()}
          inputClassName="truncate"
        />

        <Button variant="ghost" color="gray" onClick={() => setCreated(undefined)} className="self-end">
          <Translate id="common.close" />
        </Button>
      </Dialog>
    </>
  );
}

const schema = z.object({
  name: z.string().min(2).max(128),
  description: z.string(),
});

type CreateApiCredentialFormProps = {
  type: ApiCredential['type'];
  onCancel: () => void;
  onCreated: (value: string) => void;
};

function CreateApiCredentialForm({ type, onCancel, onCreated }: CreateApiCredentialFormProps) {
  const T = Translate.prefix(`pages.${type}Settings.apiCredential`);
  const t = T.useTranslate();

  const organization = useOrganization();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: '',
      description: '',
    },
    resolver: useZodResolver(schema, {
      name: t('createDialog.nameLabel'),
      description: t('createDialog.descriptionLabel'),
    }),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...useApiMutationFn('createApiCredential', (values: FormValues<typeof form>) => ({
      body: {
        name: values.name,
        description: values.description || undefined,
        type: upperCase(type),
        organization_id: organization.id,
      },
    })),
    async onSuccess(result, { name }) {
      await invalidate('listApiCredentials');

      notify.success(t('createDialog.successNotification', { name }));
      form.reset();

      onCreated(result.credential!.token!);
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <ControlledInput control={form.control} name="name" label={<T id="createDialog.nameLabel" />} />

      <ControlledInput
        control={form.control}
        name="description"
        label={<T id="createDialog.descriptionLabel" />}
      />

      <footer className="row mt-2 justify-end gap-2">
        <Button variant="ghost" color="gray" onClick={onCancel}>
          <Translate id="common.cancel" />
        </Button>

        <Button type="submit" loading={form.formState.isSubmitting}>
          <Translate id="common.create" />
        </Button>
      </footer>
    </form>
  );
}
