import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.general.email');

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
      <div className="row items-center justify-between gap-4 p-3">
        <ControlledInput
          control={form.control}
          name="email"
          type="email"
          label={<T id="label" />}
          className="w-full max-w-lg"
        />

        <Button
          type="submit"
          loading={form.formState.isSubmitting}
          disabled={!form.formState.isDirty || Object.keys(form.formState.errors).length > 0}
        >
          <Translate id="common.save" />
        </Button>
      </div>

      <footer className="text-xs text-dim">
        <T id="footer" />
      </footer>
    </form>
  );
}
