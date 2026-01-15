import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Spinner } from '@koyeb/design-system';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  apiMutation,
  apiQuery,
  mapOrganizationMember,
  useOrganization,
  useSwitchOrganization,
  useUser,
} from 'src/api';
import { notify } from 'src/application/notify';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader, openDialog } from 'src/components/dialog';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useOnRouteStateCreate } from 'src/hooks/router';
import { Translate, createTranslate } from 'src/intl/translate';
import { OrganizationMember } from 'src/model';

const T = createTranslate('pages.userSettings.organizations');

export function OrganizationsPage() {
  useOnRouteStateCreate(() => {
    openDialog('CreateOrganization');
  });

  return (
    <>
      <Title
        title={<T id="title" />}
        end={
          <Button onClick={() => openDialog('CreateOrganization')}>
            <T id="createOrganization" />
          </Button>
        }
      />

      <CreateOrganization />

      <OrganizationList />
    </>
  );
}

const schema = z.object({
  organizationName: z.string().min(1).max(64),
});

function CreateOrganization() {
  const t = T.useTranslate();

  const form = useForm({
    mode: 'onChange',
    defaultValues: {
      organizationName: '',
    },
    resolver: zodResolver(schema),
  });

  const switchOrganization = useSwitchOrganization();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...apiMutation('post /v1/organizations', ({ organizationName }: FormValues<typeof form>) => ({
      body: { name: organizationName },
    })),
    onError: useFormErrorHandler(form, (error) => ({
      organizationName: error.name,
    })),
    async onSuccess({ organization }, { organizationName }) {
      await switchOrganization.mutateAsync({
        id: organization!.id!,
        externalId: organization!.external_id!,
      });

      await navigate({ to: '/' });
      notify.success(t('create.success', { organizationName }));
    },
  });

  return (
    <Dialog id="CreateOrganization" onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="create.title" />} />

      <p className="text-dim">
        <T id="create.description" />
      </p>

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <OrganizationNameField
          form={form}
          label={<T id="create.organizationNameLabel" />}
          tooltipPlacement="bottom-start"
        />

        <DialogFooter>
          <CloseDialogButton>
            <Translate id="common.cancel" />
          </CloseDialogButton>

          <Button
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={!form.formState.isValid}
            className="self-start"
          >
            <Translate id="common.next" />
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

function OrganizationList() {
  const user = useUser();

  const query = useQuery({
    ...apiQuery('get /v1/organization_members', {
      query: {
        user_id: user?.id,
        organization_statuses: ['ACTIVE', 'WARNING', 'LOCKED', 'DEACTIVATING', 'DEACTIVATED'],
      },
    }),
    refetchInterval: false,
    enabled: user !== undefined,
    select: ({ members }) => members!.map(mapOrganizationMember),
  });

  if (query.isPending) {
    return <Spinner className="size-4" />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  const memberships = query.data;

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
  const currentOrganization = useOrganization();
  const navigate = useNavigate();

  const switchOrganization = useSwitchOrganization({
    onSuccess: () => void navigate({ to: '/' }),
  });

  const manageOrganization = useSwitchOrganization({
    onSuccess: () => void navigate({ to: '/settings' }),
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

      <div className="ml-auto row gap-2">
        {organization.id !== currentOrganization?.id && (
          <Button variant="outline" color="gray" onClick={() => switchOrganization.mutate(organization)}>
            <T id="switch" />
          </Button>
        )}

        <Button variant="outline" color="gray" onClick={() => manageOrganization.mutate(organization)}>
          <T id="manage" />
        </Button>
      </div>
    </div>
  );
}
