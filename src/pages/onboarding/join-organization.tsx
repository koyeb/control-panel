import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, InfoTooltip, Tooltip } from '@koyeb/design-system';
import { api } from 'src/api/api';
import { useInvitationsQuery } from 'src/api/hooks/invitation';
import { useUser } from 'src/api/hooks/session';
import { useInvalidateApiQuery } from 'src/api/use-api';
import { useToken } from 'src/application/token';
import { AcceptOrDeclineInvitation } from 'src/components/accept-or-decline-invitation';
import { ControlledInput } from 'src/components/controlled';
import { IconCheck, IconArrowRight } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';
import { entries } from 'src/utils/object';

import { OnboardingStepper } from './stepper';

const T = createTranslate('onboarding.joinOrganization');

const schema = z.object({
  organizationName: z
    .string()
    .min(1)
    .max(39)
    .refine((value) => value.match(/^[-a-z0-9]+$/) !== null),
});

export function JoinOrganization() {
  const user = useUser();
  const invitationsQuery = useInvitationsQuery({ userId: user.id, status: 'pending' });

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

export function CreateOrganization() {
  const { token, setToken } = useToken();
  const invalidate = useInvalidateApiQuery();
  const [inputFocused, setInputFocused] = useState(false);

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      organizationName: '',
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
      <OnboardingStepper step={2} />

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
        <Tooltip
          open={inputFocused}
          allowHover
          arrow={false}
          placement="bottom-end"
          offset={8}
          content={<OrganizationNameTooltip name={form.watch('organizationName')} />}
          className="!bg-muted"
        >
          {(props) => (
            <div {...props}>
              <ControlledInput
                control={form.control}
                name="organizationName"
                label={<T id="organizationNameLabel" />}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </div>
          )}
        </Tooltip>

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

function OrganizationNameTooltip({ name }: { name: string }) {
  const rules = useMemo(
    () => ({
      maxLength: name !== '' && name.length < 40,
      letters: name !== '' && name.match(/[A-Z]/) === null,
      whitespace: name !== '' && name.match(/ /) === null,
      alphanumeric: name !== '' && name.match(/^[- A-Za-z0-9]+$/) !== null,
    }),
    [name],
  );

  return (
    <ul className="col gap-1">
      {entries(rules).map(([rule, valid]) => (
        <li
          key={rule}
          className={clsx('row items-center gap-1', valid && 'text-green', !valid && 'text-dim')}
        >
          <IconCheck className="size-em" />
          <T id={`organizationNameRules.${rule}`} />
        </li>
      ))}
    </ul>
  );
}
