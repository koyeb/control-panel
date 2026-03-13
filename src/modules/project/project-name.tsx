import { Button, InputEnd } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { useCurrentProject } from 'src/api/hooks/project';
import { notify } from 'src/application/notify';
import { CopyIconButton } from 'src/components/copy-icon-button';
import { DocumentationLink } from 'src/components/documentation-link';
import { ControlledInput, ControlledTextArea, Input } from 'src/components/forms';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.projectSettings.projectInfo');

export function ProjectName() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const project = useCurrentProject();

  const documentationLink = (children: React.ReactNode) => (
    <DocumentationLink path="/docs/projects">{children}</DocumentationLink>
  );

  const form = useForm({
    defaultValues: {
      name: project?.name,
      description: project?.description,
    },
  });

  const mutation = useMutation({
    ...apiMutation('patch /v1/projects/{id}', ({ name, description }: FormValues<typeof form>) => ({
      path: { id: project?.id ?? '' },
      body: { name, description },
    })),
    onSuccess: async ({ project }) => {
      await Promise.all([
        invalidate('get /v1/projects'),
        invalidate('get /v1/projects/{id}', { path: { id: project!.id! } }),
      ]);

      form.reset({ name: project!.name!, description: project!.description! });

      notify.success(t('updated'));
    },
    onError: useFormErrorHandler(form),
  });

  return (
    <section className="rounded-md border">
      <div className="col gap-4 p-4">
        <h2 className="text-lg font-medium">
          <T id="title" />
        </h2>

        <form
          id="project-name-form"
          onSubmit={handleSubmit(form, mutation.mutateAsync)}
          className="col gap-4"
        >
          <Input
            readOnly
            label={<T id="projectId.label" />}
            tooltip={<T id="projectId.tooltip" />}
            value={project?.id}
            end={
              <InputEnd>
                <CopyIconButton text={project?.id ?? ''} className="size-4" />
              </InputEnd>
            }
            className="max-w-md"
          />

          <ControlledInput
            control={form.control}
            name="name"
            label={<T id="projectName.label" />}
            tooltip={<T id="projectName.tooltip" />}
            className="max-w-md"
          />

          <ControlledTextArea
            control={form.control}
            name="description"
            label={<T id="projectDescription.label" />}
            className="max-w-md"
          />
        </form>
      </div>

      <footer className="row items-center justify-between gap-4 border-t p-4">
        <p>
          <T id="documentationLink" values={{ link: documentationLink }} />
        </p>

        <Button
          type="submit"
          form="project-name-form"
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty}
        >
          <Translate id="common.save" />
        </Button>
      </footer>
    </section>
  );
}
