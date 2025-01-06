import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { FormState, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog } from '@koyeb/design-system';
import { useApps } from 'src/api/hooks/service';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput, ControlledSelect } from 'src/components/controlled';
import { handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { createTranslate, Translate } from 'src/intl/translate';
import { getId, getName } from 'src/utils/object';

const T = createTranslate('pages.domains.createDialog');

type CreateDomainDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (domainId: string) => void;
};

export function CreateDomainDialog({ open, onClose, onCreated }: CreateDomainDialogProps) {
  const t = T.useTranslate();

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      title={<T id="title" />}
      description={<T id="description" />}
      width="lg"
    >
      <DomainForm
        onCreated={(domainId, domainName) => {
          notify.success(t('successNotification', { domainName }));
          onCreated(domainId);
        }}
        renderFooter={(formState) => (
          <footer className="row mt-2 justify-end gap-2">
            <Button variant="ghost" color="gray" onClick={onClose}>
              <Translate id="common.cancel" />
            </Button>

            <Button type="submit" loading={formState.isSubmitting}>
              <T id="submitButton" />
            </Button>
          </footer>
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
    ...useApiMutationFn('createDomain', (values: FormValues) => ({
      body: {
        name: values.domainName,
        app_id: values.appId ?? undefined,
        type: 'CUSTOM' as const,
      },
    })),
    async onSuccess({ domain }, { domainName }) {
      await invalidate('listDomains');
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
