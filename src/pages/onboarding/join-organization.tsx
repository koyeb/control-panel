import { Button, InfoTooltip, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { api } from 'src/api/api';
import { useInvitationsQuery } from 'src/api/hooks/invitation';
import { useUser } from 'src/api/hooks/session';
import { User } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { HandleInvitation } from 'src/components/handle-invitations';
import { IconArrowRight } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError, QueryGuard } from 'src/components/query-error';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useMount } from 'src/hooks/lifecycle';
import { useHistoryState, useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { defined } from 'src/utils/assert';
import { slugify } from 'src/utils/strings';

import Background from './images/join-organization.svg?react';

const T = createTranslate('pages.onboarding.joinOrganization');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(39)
    .refine((value) => value.match(/^[-a-z0-9]+$/) !== null),
});

export function JoinOrganization() {
  const user = useUser();
  const invitationsQuery = useInvitationsQuery({ userId: user.id, status: 'PENDING' });

  if (invitationsQuery.isPending) {
    return <Loading />;
  }

  if (invitationsQuery.isError) {
    return <QueryError error={invitationsQuery.error} />;
  }

  return (
    <>
      <Background className="absolute bottom-0 hidden md:block" />

      <QueryGuard query={invitationsQuery}>
        {(invitations) => (
          <>
            {invitations.length === 0 && <CreateOrganization />}
            {invitations.length > 0 && <HandleInvitation invitation={defined(invitations[0])} />}
          </>
        )}
      </QueryGuard>
    </>
  );
}

function CreateOrganization() {
  const user = useUser();
  const { token, setToken } = useToken();
  const invalidate = useInvalidateApiQuery();
  const navigate = useNavigate();
  const state = useHistoryState<{ createOrganization: boolean }>();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      organizationName: state.createOrganization ? defaultOrganizationName(user) : '',
    },
    resolver: useZodResolver(schema),
  });

  useMount(() => {
    if (state.createOrganization) {
      mutation.mutate(form.getValues());
    }
  });

  const onError = useFormErrorHandler(form, (error) => ({
    organizationName: error.name,
  }));

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
    async onSuccess(token) {
      setToken(token);
      await invalidate('getCurrentOrganization');
    },
    onError(error) {
      if (state.createOrganization) {
        navigate(routes.home(), { state: {} });
      } else {
        onError(error);
      }
    },
  });

  if (state.createOrganization) {
    return (
      <section className="row flex-1 items-center justify-center gap-2">
        <Spinner className="size-5" />
        <T id="creatingOrganization" />
      </section>
    );
  }

  return (
    <section className="col flex-1 justify-center gap-8">
      <div>
        <h1 className="mb-1 text-3xl font-semibold">
          <T id="title" />
          <InfoTooltip content={<T id="tooltip" />} className="max-w-lg" iconClassName="inline-block ms-2" />
        </h1>
        <p className="text-dim">
          <T id="canBeChanged" />
        </p>
      </div>

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <OrganizationNameField form={form} label={<T id="organizationNameLabel" />} />

        <Button
          type="submit"
          disabled={!form.formState.isValid}
          loading={form.formState.isSubmitting}
          className="self-end"
        >
          <Translate id="common.next" />
          <IconArrowRight />
        </Button>
      </form>
    </section>
  );
}

function defaultOrganizationName(user: User): string {
  if (user.githubUser) {
    return slugify(user.githubUser, 39);
  }

  return slugify(user.email.replace(/@.*/, ''), 39);
}
