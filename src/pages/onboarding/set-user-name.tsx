import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import z from 'zod';

import { apiMutation, useInvalidateApiQuery } from 'src/api';
import { ControlledInput } from 'src/components/forms';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';
import { OnboardingLayout } from 'src/layouts/onboarding/onboarding-layout';

import { AuthButton } from '../authentication/components/auth-button';

const T = createTranslate('pages.onboarding.setUserName');

const schema = z.object({
  name: z.string().min(1),
});

export function SetUserName() {
  const invalidate = useInvalidateApiQuery();
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
      await invalidate('get /v1/account/profile');
    },
  });

  return (
    <OnboardingLayout sentence={<T id="sidebar" />}>
      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="col gap-4">
        <ControlledInput
          control={form.control}
          name="name"
          label={<T id="name.label" />}
          placeholder={t('name.placeholder')}
        />

        <AuthButton type="submit" className="self-start">
          <T id="submit" />
        </AuthButton>
      </form>
    </OnboardingLayout>
  );
}
