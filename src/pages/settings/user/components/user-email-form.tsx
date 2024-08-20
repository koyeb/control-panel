import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.userSettings.general.email');

const schema = z.object({
  email: z.string().email(),
});

export function UserEmailForm() {
  const t = T.useTranslate();
  const user = useUser();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      email: user.email,
    },
    resolver: useZodResolver(schema),
  });

  const mutation = useMutation({
    ...useApiMutationFn('updateUser', ({ email }: FormValues<typeof form>) => ({
      query: {},
      body: { email },
    })),
    async onSuccess(_, { email }) {
      form.reset({ email });
      notify.success(t('successNotification', { email }));
    },
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="card">
      <div className="p-4">
        <ControlledInput control={form.control} name="email" type="email" label={<T id="label" />} />
      </div>

      <footer>
        <p className="text-xs text-dim">
          <T id="footer" />
        </p>

        <Button
          type="submit"
          className="self-start"
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty || Object.keys(form.formState.errors).length > 0}
        >
          <Translate id="common.save" />
        </Button>
      </footer>
    </form>
  );
}
