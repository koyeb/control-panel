import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Spinner } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useOrganizationUnsafe, useUserOrganizationMemberships } from 'src/api/hooks/session';
import { OrganizationMember } from 'src/api/model';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { CloseDialogButton, Dialog, DialogFooter, DialogHeader } from 'src/components/dialog';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate, useOnRouteStateCreate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.organizations');

export function OrganizationsPage() {
  const openDialog = Dialog.useOpen();

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
      <CreateOrganizationDialog />
      <OrganizationList />
    </>
  );
}

const schema = z.object({
  organizationName: z.string().min(1).max(39),
});

function CreateOrganizationDialog() {
  const t = T.useTranslate();
  const navigate = useNavigate();
  const { token, setToken } = useToken();

  const form = useForm<z.infer<typeof schema>>({
    mode: 'onChange',
    defaultValues: {
      organizationName: '',
    },
    resolver: useZodResolver(schema),
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
    <Dialog id="CreateOrganization" onClosed={form.reset} className="col w-full max-w-xl gap-4">
      <DialogHeader title={<T id="createOrganizationDialog.title" />} />

      <p className="text-dim">
        <T id="createOrganizationDialog.description" />
      </p>

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <OrganizationNameField
          form={form}
          label={<T id="createOrganizationDialog.organizationNameLabel" />}
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
  const query = useUserOrganizationMemberships();

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
