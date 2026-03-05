import { zodResolver } from '@hookform/resolvers/zod';
import { Button, DialogFooter } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { apiMutation, apiQuery, useInvalidateApiQuery } from 'src/api';
import { useCurrentProjectId } from 'src/api/hooks/project';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogHeader, closeDialog } from 'src/components/dialog';
import { ControlledInput, ControlledTextArea } from 'src/components/forms';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.createProjectDialog');

const schema = z.object({
  name: z.string().min(1),
  description: z.string(),
});

export function CreateProjectDialog() {
  const t = T.useTranslate();
  const queryClient = useQueryClient();
  const invalidate = useInvalidateApiQuery();

  const [, setCurrentProjectId] = useCurrentProjectId();

  const form = useForm({
    defaultValues: { name: '', description: '' },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/projects', ({ name, description }: FormValues<typeof form>) => ({
      body: {
        name,
        description: description || undefined,
      },
    })),
    onError: useFormErrorHandler(form),
    async onSuccess({ project }) {
      await Promise.all([
        queryClient.ensureQueryData(apiQuery('get /v1/projects/{id}', { path: { id: project!.id! } })),
        invalidate('get /v1/projects'),
      ]);

      setCurrentProjectId(project!.id!);
      closeDialog();

      notify.success(t('created', { name: project!.name! }));
    },
  });

  return (
    <Dialog id="CreateProject" onClosed={form.reset} className="col w-full max-w-lg gap-4">
      <DialogHeader title={<T id="title" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-2">
        <ControlledInput control={form.control} name="name" label={<T id="name.label" />} />
        <ControlledTextArea control={form.control} name="description" label={<T id="description.label" />} />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>
          <Button type="submit" loading={mutation.isPending}>
            <T id="submit" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
