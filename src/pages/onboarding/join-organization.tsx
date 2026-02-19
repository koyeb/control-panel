import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, apiQuery, mapInvitation } from 'src/api';
import { AuthButton } from 'src/components/auth-button';
import { HandleInvitation } from 'src/components/handle-invitations';
import { Loading } from 'src/components/loading';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError, QueryGuard } from 'src/components/query-error';
import { InfoTooltip } from 'src/components/tooltip';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useNavigate } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';
import { defined } from 'src/utils/assert';

const T = createTranslate('pages.onboarding.joinOrganization');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(64)
    .refine((value) => value.match(/^[-a-z0-9]+$/) !== null),
});

export function JoinOrganization() {
  const invitationsQuery = useQuery({
    ...apiQuery('get /v1/account/organization_invitations', { query: { statuses: ['PENDING'] } }),
    select: ({ invitations }) => invitations!.map(mapInvitation),
  });

  if (invitationsQuery.isPending) {
    return <Loading />;
  }

  if (invitationsQuery.isError) {
    return <QueryError error={invitationsQuery.error} />;
  }

  return (
    <OnboardingLayout sentence={<T id="sidebar" />} className="max-w-xl">
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
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      organizationName: '',
    },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('post /v1/organizations', ({ organizationName }: FormValues<typeof form>) => ({
      body: { name: organizationName },
    })),
    async onSuccess({ organization }) {
      await navigate({
        to: '/',
        search: { 'organization-id': organization!.external_id! },
        reloadDocument: true,
      });
    },
    onError: useFormErrorHandler(form, (error) => ({
      organizationName: error.name,
    })),
  });

  return (
    <section className="col flex-1 justify-center gap-8">
      <div>
        <div className="mb-1 row items-center gap-2">
          <h1 className="text-3xl font-semibold">
            <T id="title" />
          </h1>
          <InfoTooltip content={<T id="tooltip" />} />
        </div>
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)}>
        <OrganizationNameField
          form={form}
          label={<T id="organizationNameLabel" />}
          tooltipPlacement="bottom-end"
        />

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
