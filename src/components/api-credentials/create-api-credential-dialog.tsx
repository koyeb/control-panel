import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useInvalidateApiQuery, useOrganization, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { ControlledInput } from 'src/components/forms';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { ApiCredential } from 'src/model';
import { upperCase } from 'src/utils/strings';

import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, openDialog } from '../dialog';
import { Input } from '../forms/input';

type CreateApiCredentialDialogProps = {
  type: ApiCredential['type'];
};

export function CreateApiCredentialDialog({ type }: CreateApiCredentialDialogProps) {
  const T = createTranslate(`pages.${type}Settings.apiCredential`);

  const user = useUser();
  const organization = useOrganization();

  const [created, setCreated] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Dialog id="CreateApiCredential" className="col w-full max-w-xl gap-4">
        <DialogHeader title={<T id="create.title" />} />

        <p className="text-dim">
          <T
            id="create.description"
            values={{ organizationName: organization?.name, userName: user?.name }}
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
        <DialogHeader title={<T id="created.title" />} />

        <p className="text-dim">
          <T id="created.description" />
        </p>

        <Input
          ref={inputRef}
          value={created ?? ''}
          readOnly
          end={<CopyIconButton text={created!} className="mx-2 size-4 self-center" />}
          onClick={() => inputRef.current?.select()}
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
    resolver: zodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('post /v1/credentials', (values: FormValues<typeof form>) => ({
      body: {
        name: values.name,
        description: values.description || undefined,
        type: upperCase(type),
        organization_id: organization?.id,
      },
    })),
    async onSuccess(result, { name }) {
      await invalidate('get /v1/credentials');

      notify.success(t('create.success', { name }));
      form.reset();

      onCreated(result.credential!.token!);
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <form className="col gap-4" onSubmit={handleSubmit(form, mutation.mutateAsync)}>
      <ControlledInput control={form.control} name="name" label={<T id="create.nameLabel" />} />

      <ControlledInput control={form.control} name="description" label={<T id="create.descriptionLabel" />} />

      <DialogFooter>
        <CloseDialogButton />

        <Button type="submit" loading={form.formState.isSubmitting}>
          <Translate id="common.create" />
        </Button>
      </DialogFooter>
    </form>
  );
}
