import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit, useFormErrorHandler } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.team.inviteMember');

const schema = z.object({
  email: z.string().email().trim().toLowerCase(),
});

export function InviteMemberForm() {
  const organization = useOrganization();
  const invalidate = useInvalidateApiQuery();
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: '',
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...useApiMutationFn('sendInvitation', ({ email }: FormValues<typeof form>) => ({
      body: { email },
    })),
    async onSuccess(_, { email }) {
      await invalidate('listInvitations');
      notify.success(t('successNotification', { email }));
      form.reset();
    },
    onError: useFormErrorHandler(form),
  });

  const disabled = organization.plan === 'hobby' || organization.plan === 'starter';

  return (
    <div className="col gap-4">
      <div className="col gap-1">
        <div className="font-medium">
          <T id="title" />
        </div>

        <p className="text-dim">
          <T id="description" values={{ organizationName: organization.name }} />
        </p>
      </div>

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="row gap-4">
        <ControlledInput
          control={form.control}
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          disabled={disabled}
          className="w-full max-w-sm"
        />

        <Button
          type="submit"
          disabled={disabled || Object.keys(form.formState.errors).length > 0}
          loading={form.formState.isSubmitting}
          className="self-start"
        >
          <T id="submitButton" />
        </Button>
      </form>

      {disabled && (
        <p className="border-l-4 border-green/50 pl-3 text-xs">
          <T id="hobbyPlanUpgrade" />
        </p>
      )}
    </div>
  );
}
