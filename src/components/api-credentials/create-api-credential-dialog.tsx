import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Input } from '@koyeb/design-system';
import { useOrganization, useUser } from 'src/api/hooks/session';
import { ApiCredential } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { upperCase } from 'src/utils/strings';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from '../dialog';

type CreateApiCredentialDialogProps = {
  type: ApiCredential['type'];
};

export function CreateApiCredentialDialog({ type }: CreateApiCredentialDialogProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
  const openDialog = Dialog.useOpen();

  const user = useUser();
  const organization = useOrganization();

  const [created, setCreated] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Dialog id="CreateApiCredential" className="col w-full max-w-xl gap-4">
        <DialogHeader title={<T id="createDialog.title" />} />

        <p className="text-dim">
          <T
            id="createDialog.description"
            values={{ organizationName: organization.name, userName: user.name }}
          />
        </p>

        <CreateApiCredentialForm
          type={type}
          onCreated={(created) => {
            setCreated(created);
            openDialog('ApiCredentialCreated');
          }}
        />
      </Dialog>

      <Dialog
        id="ApiCredentialCreated"
        onClosed={() => setCreated(undefined)}
        className="col w-full max-w-xl gap-4"
      >
        <DialogHeader title={<T id="createDialog.createdTitle" />} />

        <p className="text-dim">
          <T id="createDialog.createdDescription" />
        </p>

        <Input
          ref={inputRef}
          value={created ?? ''}
          readOnly
          end={<CopyIconButton text={created!} className="mx-2 size-4 self-center" />}
          onClick={() => inputRef.current?.select()}
          inputClassName="truncate"
        />

        <DialogFooter>
          <CloseDialogButton />
        </DialogFooter>
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
  onCreated: (value: string) => void;
};

function CreateApiCredentialForm({ type, onCreated }: CreateApiCredentialFormProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);
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

      <DialogFooter>
        <CloseDialogButton />

        <Button type="submit" loading={form.formState.isSubmitting}>
          <Translate id="common.create" />
        </Button>
      </DialogFooter>
    </form>
  );
}
