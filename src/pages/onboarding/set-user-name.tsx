import { zodResolver } from '@hookform/resolvers/zod';
import { Spinner } from '@koyeb/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { apiMutation, apiQuery } from 'src/api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/forms';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';
import { waitFor } from 'src/utils/promises';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.setUserName');

const schema = z.object({
  name: z.string().min(1),
});

export function SetUserName() {
  const queryClient = useQueryClient();
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: { name: '' },
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    ...apiMutation('patch /v2/account/profile', ({ name }: FormValues<typeof form>) => ({
      body: { name },
    })),
    onSuccess: async () => {
      const checkName = async () => {
        const { user } = await queryClient.fetchQuery(apiQuery('get /v1/account/profile', {}));
        return user?.name !== '';
      };

      if (!(await waitFor(checkName, { timeout: 10 * 1000 }))) {
        notify.warning(t('timeout'));
      }
    },
  });

  return (
    <OnboardingLayout sentence={<T id="sidebar" />}>
      <section className="col flex-1 justify-center gap-8">
        <div>
          <div className="mb-1 row items-center gap-2">
            <h1 className="text-3xl font-semibold">
              <T id="title" />
            </h1>
          </div>
          <p className="text-dim">
            <T id="description" />
          </p>
        </div>

        <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
          <ControlledInput
            control={form.control}
            name="name"
            label={<T id="name.label" />}
            placeholder={t('name.placeholder')}
          />

          <AuthButton type="submit" className="self-start">
            <T id="submit" />
            {mutation.isPending && <Spinner className="size-4" />}
          </AuthButton>
        </form>
      </section>
    </OnboardingLayout>
  );
}
