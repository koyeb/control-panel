import { InfoTooltip, Spinner } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useInvitationsQuery } from 'src/api/hooks/invitation';
import { useUser } from 'src/api/hooks/session';
import { useApi } from 'src/api/use-api';
import { HandleInvitation } from 'src/components/handle-invitations';
import { Loading } from 'src/components/loading';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError, QueryGuard } from 'src/components/query-error';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useMount } from 'src/hooks/lifecycle';
import { useHistoryState, useNavigate } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';
import { defined } from 'src/utils/assert';

import { AuthButton } from '../authentication/components/auth-button';

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
    <OnboardingLayout sentence={<T id="sidebar" />}>
      <QueryGuard query={invitationsQuery}>
        {(invitations) => (
          <>
            {invitations.length === 0 && <CreateOrganization />}
            {invitations.length > 0 && <HandleInvitation invitation={defined(invitations[0])} />}
          </>
        )}
      </QueryGuard>
    </OnboardingLayout>
  );
}

function CreateOrganization() {
  const state = useHistoryState();

  const api = useApi();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      organizationName: '',
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
        body: { name: organizationName },
      });

      const { token: newToken } = await api.switchOrganization({
        path: { id: organization!.id! },
        header: {},
      });

      return newToken!.id!;
    },
    onSuccess(token) {
      navigate({ to: '/', state: { token } });
    },
    onError(error) {
      if (state.createOrganization) {
        navigate({ to: '/', state: {} });
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

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <OrganizationNameField form={form} label={<T id="organizationNameLabel" />} />

        <AuthButton
          type="submit"
          disabled={!form.formState.isValid}
          loading={form.formState.isSubmitting}
          className="mt-8 min-w-32 self-start"
        >
          <T id="submit" />
        </AuthButton>
      </form>
    </section>
  );
}
