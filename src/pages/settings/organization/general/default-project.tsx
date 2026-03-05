import { Button } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { apiMutation, apiQuery, useInvalidateApiQuery, useOrganization } from 'src/api';
import { useProject, useProjects } from 'src/api/hooks/project';
import { notify } from 'src/application/notify';
import { ControlledCombobox } from 'src/components/forms';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useDebouncedValue } from 'src/hooks/timers';
import { Translate, createTranslate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { getId, getName, hasProperty } from 'src/utils/object';

const T = createTranslate('pages.organizationSettings.general.defaultProject');

export function DefaultProject() {
  const t = T.useTranslate();
  const invalidate = useInvalidateApiQuery();
  const queryClient = useQueryClient();

  const organization = useOrganization();
  const defaultProject = defined(useProject(organization?.defaultProjectId));

  const [search, setSearch] = useState(defaultProject.name);
  const searchDebounced = useDebouncedValue(search, 300);

  const projects = useProjects({
    search: searchDebounced === defaultProject.name ? undefined : searchDebounced,
  });

  const items = useMemo(() => {
    if (projects.some(hasProperty('id', defaultProject.id))) {
      return projects;
    }

    return [defaultProject, ...projects];
  }, [projects, defaultProject]);

  const mutation = useMutation({
    ...apiMutation(
      'put /v1/organizations/{id}/default_project',
      ({ defaultProjectId }: FormValues<typeof form>) => ({
        path: { id: organization!.id },
        body: { default_project_id: defaultProjectId },
      }),
    ),
    async onSuccess(_, { defaultProjectId: id }) {
      await queryClient.ensureQueryData(apiQuery('get /v1/projects/{id}', { path: { id } }));
      await invalidate('get /v1/account/organization');
      form.reset({ defaultProjectId: id });
      notify.success(t('updated'));
    },
  });

  const form = useForm({
    defaultValues: {
      defaultProjectId: defaultProject.id,
    },
  });

  return (
    <section className="card p-4">
      <form
        onSubmit={handleSubmit(form, mutation.mutateAsync)}
        className="row items-center justify-between gap-4"
      >
        <div className="col gap-4">
          <SectionHeader title={<T id="title" />} description={<T id="description" />} />

          <ControlledCombobox
            control={form.control}
            name="defaultProjectId"
            items={items}
            getKey={getId}
            getValue={getId}
            itemToString={getName}
            renderItem={getName}
            inputValue={search}
            onInputValueChange={setSearch}
            className="w-full max-w-xs"
          />
        </div>

        <Button type="submit" disabled={!form.formState.isDirty} loading={mutation.isPending}>
          <Translate id="common.save" />
        </Button>
      </form>
    </section>
  );
}
