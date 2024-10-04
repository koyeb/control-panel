import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Dialog, Spinner } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useOrganizationUnsafe, useUser } from 'src/api/hooks/session';
import { mapOrganizationMembers } from 'src/api/mappers/session';
import { OrganizationMember } from 'src/api/model';
import { useApiMutationFn, useApiQueryFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { ControlledInput } from 'src/components/controlled';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useHistoryState, useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';
import { isSlug } from 'src/utils/strings';

const T = Translate.prefix('pages.userSettings.organizations');

export function OrganizationsPage() {
  const state = useHistoryState<{ create?: boolean } | undefined>();
  const [createDialogOpen, setCreateDialogOpen] = useState(state?.create === true);

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button onClick={() => setCreateDialogOpen(true)}>
            <T id="createOrganization" />
          </Button>
        }
      />
      <CreateOrganizationDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
      <OrganizationList />
    </>
  );
}

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(39)
    .refine(isSlug, { params: { refinement: 'isSlug' } }),
});

function CreateOrganizationDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = T.useTranslate();
  const navigate = useNavigate();
  const { token, setToken } = useToken();

  const form = useForm<z.infer<typeof schema>>({
    mode: 'onChange',
    defaultValues: {
      organizationName: '',
    },
    resolver: useZodResolver(schema, {
      organizationName: t('createOrganizationDialog.organizationNameLabel'),
    }),
  });

  const mutation = useMutation({
    async mutationFn({ organizationName }: FormValues<typeof form>) {
      const { organization } = await api.createOrganization({
        token,
        body: { name: organizationName },
      });

      const { token: newToken } = await api.switchOrganization({
        token,
        path: { id: organization!.id! },
        header: {},
      });

      return newToken!.id!;
    },
    onError: useFormErrorHandler(form, (error) => ({
      organizationName: error.name,
    })),
    onSuccess(token, { organizationName }) {
      form.reset();
      setToken(token);
      navigate(routes.home());
      notify.success(t('createOrganizationDialog.successNotification', { organizationName }));
    },
  });

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      onClosed={form.reset}
      width="lg"
      title={<T id="createOrganizationDialog.title" />}
      description={<T id="createOrganizationDialog.description" />}
    >
      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput
          control={form.control}
          name="organizationName"
          label={<T id="createOrganizationDialog.organizationNameLabel" />}
        />

        <footer className="row mt-2 justify-end gap-2">
          <Button variant="ghost" color="gray" onClick={onClose}>
            <Translate id="common.cancel" />
          </Button>
          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
            className="self-start"
          >
            <Translate id="common.next" />
          </Button>
        </footer>
      </form>
    </Dialog>
  );
}

function OrganizationList() {
  const user = useUser();

  const membersQuery = useQuery({
    ...useApiQueryFn('listOrganizationMembers', { query: { user_id: user.id } }),
    select: mapOrganizationMembers,
  });

  if (membersQuery.isPending) {
    return <Spinner className="size-4" />;
  }

  if (membersQuery.isError) {
    return <QueryError error={membersQuery.error} />;
  }

  const memberships = membersQuery.data;

  if (memberships.length === 0) {
    return <>No organizations</>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {memberships.map((membership) => (
        <li key={membership.id} className="p-2">
          <OrganizationListItem organization={membership.organization} />
        </li>
      ))}
    </ul>
  );
}

function OrganizationListItem({ organization }: { organization: OrganizationMember['organization'] }) {
  const currentOrganization = useOrganizationUnsafe();
  const { setToken } = useToken();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();

  const { mutate: switchOrganization } = useMutation({
    ...useApiMutationFn('switchOrganization', (_: string) => ({
      path: { id: organization.id },
      header: {},
    })),
    onSuccess(token, redirect) {
      setToken(token.token!.id!);

      void invalidate('getCurrentOrganization');
      void invalidate('listOrganizationMembers');

      navigate(redirect);
    },
  });

  return (
    <div className="row items-center gap-2">
      <OrganizationAvatar organizationName={organization.name} className="size-8 rounded-full" />

      <div className="col gap-1">
        <div>{organization.name}</div>
        <div className="text-xs text-dim">
          <T id="owner" />
        </div>
      </div>

      <div className="row ml-auto gap-2">
        {organization.id !== currentOrganization?.id && (
          <Button variant="outline" color="gray" onClick={() => switchOrganization(routes.home())}>
            <T id="switch" />
          </Button>
        )}

        <Button
          variant="outline"
          color="gray"
          onClick={() => switchOrganization(routes.organizationSettings.index())}
        >
          <T id="manage" />
        </Button>
      </div>
    </div>
  );
}
