import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiMutation, useInvalidateApiQuery, useUser } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useZodResolver } from 'src/hooks/validation';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.userSettings.general.name');

const schema = z.object({
  name: z.string().min(2).max(128),
});

export function UserNameForm() {
  const t = T.useTranslate();
  const user = useUser();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      name: user.name,
    },
    resolver: useZodResolver(schema),
  });

  const invalidate = useInvalidateApiQuery();

  const mutation = useMutation({
    ...apiMutation('patch /v1/account/profile', ({ name }: FormValues<typeof form>) => ({
      query: {},
      body: { name },
    })),
    async onSuccess(_, { name }) {
      await invalidate('get /v1/account/profile');
      form.reset({ name });
      notify.success(t('successNotification', { name }));
    },
  });

  return (
    <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="card">
      <div className="row items-center justify-between gap-4 p-3">
        <ControlledInput
          control={form.control}
          name="name"
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

      <footer>
        <p className="text-xs text-dim">
          <T id="footer" />
        </p>
      </footer>
    </form>
  );
}
