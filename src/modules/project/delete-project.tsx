import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';

import { apiMutation, useInvalidateApiQuery, useOrganization } from 'src/api';
import { useCurrentProject, useCurrentProjectId, useProjects } from 'src/api/hooks/project';
import { notify } from 'src/application/notify';
import { closeDialog, openDialog } from 'src/components/dialog';
import { createTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

const T = createTranslate('pages.projectSettings.deleteProject');

export function DeleteProject() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();

  const organization = useOrganization();
  const projects = useProjects();
  const project = useCurrentProject();
  const [, setCurrentProjectId] = useCurrentProjectId();

  const mutation = useMutation({
    ...apiMutation('delete /v1/projects/{id}', { path: { id: project?.id ?? '' } }),
    onSuccess: async () => {
      const otherProject = projects.find(({ id }) => id !== project?.id);
      assert(otherProject !== undefined);

      await invalidate('get /v1/projects');
      setCurrentProjectId(otherProject.id);

      closeDialog();

      notify.success(t('deleting'));
    },
  });

  return (
    <section className="rounded-md border">
      <div className="row items-center justify-between gap-4 p-4">
        <div className="col gap-3">
          <h2 className="text-lg font-medium">
            <T id="title" />
          </h2>

          <p className="text-dim">
            <T id="description" />
          </p>
        </div>

        <Button
          color="red"
          disabled={project?.id === organization?.defaultProjectId}
          onClick={() =>
            openDialog('Confirmation', {
              title: t('title'),
              description: t('description', { name: project?.name }),
              confirmationText: project?.name ?? '',
              submitText: t('confirmation.confirm'),
              onConfirm: () => mutation.mutateAsync(),
            })
          }
        >
          <T id="delete" />
        </Button>
      </div>

      {project?.id === organization?.defaultProjectId && (
        <footer className="border-t p-4">
          <p className="text-xs text-dim">
            <T id="isDefaultProject" />
          </p>
        </footer>
      )}
    </section>
  );
}
