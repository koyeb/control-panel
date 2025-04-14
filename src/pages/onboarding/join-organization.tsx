import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, InfoTooltip, Stepper } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useInvitationsQuery } from 'src/api/hooks/invitation';
import { useUser } from 'src/api/hooks/session';
import { User } from 'src/api/model';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useToken } from 'src/application/token';
import { AcceptOrDeclineInvitation } from 'src/components/accept-or-decline-invitation';
import { IconArrowRight } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { OrganizationNameField } from 'src/components/organization-name-field';
import { QueryError } from 'src/components/query-error';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { slugify } from 'src/utils/strings';

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

  const invitation = invitationsQuery.data[0];

  if (invitation !== undefined) {
    return <AcceptOrDeclineInvitation invitation={invitation} />;
  }

  return <CreateOrganization />;
}

function CreateOrganization() {
  const user = useUser();
  const { token, setToken } = useToken();
  const invalidate = useInvalidateApiQuery();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      organizationName: defaultOrganizationName(user),
    },
    resolver: useZodResolver(schema),
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
    onError,
  });

  return (
    <section className="col w-full max-w-xl gap-6">
      <Stepper totalSteps={3} activeStep={2} />

      <div>
        <h1 className="typo-heading mb-1">
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
