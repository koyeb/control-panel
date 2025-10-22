import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { FormState, useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useApps, useInvalidateApiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { ControlledInput, ControlledSelect } from 'src/components/forms';
import { handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';
import { getId, getName } from 'src/utils/object';

const T = createTranslate('pages.domains.createDialog');

type CreateDomainDialogProps = {
  onCreated: (domainId: string) => void;
};

export function CreateDomainDialog({ onCreated }: CreateDomainDialogProps) {
  const t = T.useTranslate();

  return (
    <Dialog id="CreateDomain" className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <DomainForm
        onCreated={(domainId, domainName) => {
          notify.success(t('successNotification', { domainName }));
          onCreated(domainId);
        }}
        renderFooter={(formState) => (
          <DialogFooter>
            <CloseDialogButton>
              <Translate id="common.cancel" />
            </CloseDialogButton>

            <Button type="submit" loading={formState.isSubmitting}>
              <T id="submitButton" />
            </Button>
          </DialogFooter>
        )}
      />
    </Dialog>
  );
}

const schema = z.object({
  domainName: z.string().min(1),
  appId: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

type DomainFormProps = {
  onCreated: (domainId: string, domainName: string) => void;
  renderFooter: (formState: FormState<FormValues>) => React.ReactNode;
};

function DomainForm({ onCreated, renderFooter }: DomainFormProps) {
  const apps = useApps() ?? [];

  const form = useForm<FormValues>({
    defaultValues: {
      domainName: '',
      appId: null,
    },
    resolver: zodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('post /v1/domains', (values: FormValues) => ({
      body: {
        name: values.domainName,
        app_id: values.appId ?? undefined,
        type: 'CUSTOM' as const,
      },
    })),
    async onSuccess({ domain }, { domainName }) {
      await invalidate('get /v1/domains');
      form.reset();
      onCreated(domain!.id!, domainName);
    },
    onError: useFormErrorHandler(form, mapError),
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
      <ControlledInput control={form.control} name="domainName" label={<T id="domainNameLabel" />} />

      <ControlledSelect
        control={form.control}
        name="appId"
        label={<T id="appLabel" />}
        items={apps}
        getKey={getId}
        itemToString={getName}
        itemToValue={getId}
        renderItem={getName}
        renderNoItems={() => <T id="noApps" />}
      />

      {renderFooter(form.formState)}
    </form>
  );
}

function mapError(error: Record<string, string>) {
  return {
    domainName: error.name,
    appId: error.app_id,
  };
}
