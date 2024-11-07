import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.coupon');

export function Coupon() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: {
      code: '',
    },
  });

  const mutation = useMutation({
    ...useApiMutationFn('redeemCoupon', ({ code }: FormValues<typeof form>) => ({
      query: { code },
    })),
    onSuccess() {
      form.reset();
      notify.success(t('couponSent'));
    },
  });

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="row max-w-md items-center gap-4">
        <ControlledInput
          control={form.control}
          disabled={organization.plan === 'hobby'}
          name="code"
          placeholder={t('placeholder')}
          className="w-full"
        />

        <Button type="submit" disabled={organization.plan === 'hobby'} loading={form.formState.isSubmitting}>
          <T id="submit" />
        </Button>
      </form>

      {organization.plan === 'hobby' && (
        <p className="border-l-4 border-green/50 pl-3 text-xs">
          <T id="hobbyPlanUpgrade" />
        </p>
      )}
    </section>
  );
}
