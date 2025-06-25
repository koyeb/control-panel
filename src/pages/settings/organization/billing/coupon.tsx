import { Button } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormValues, handleSubmit } from 'src/hooks/form';
import { useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.coupon');

export function Coupon() {
  const t = T.useTranslate();

  const organization = useOrganization();
  const isHobby = organization.plan === 'hobby';

  const params = useSearchParams();

  const form = useForm({
    defaultValues: {
      code: params.get('coupon') ?? '',
    },
  });

  const mutation = useMutation({
    ...useApiMutationFn('redeemCoupon', ({ code }: FormValues<typeof form>) => ({
      body: { code },
    })),
    onSuccess() {
      form.reset();
      notify.success(t('couponSent'));
    },
  });

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <form onSubmit={handleSubmit(form, mutation.mutateAsync)} className="row items-center gap-4">
        <ControlledInput
          control={form.control}
          disabled={isHobby}
          name="code"
          placeholder={t('placeholder')}
          className="w-full max-w-xs"
        />

        <Button type="submit" disabled={isHobby} loading={form.formState.isSubmitting}>
          <T id="submit" />
        </Button>
      </form>

      {isHobby && (
        <p className="border-l-4 border-green/50 pl-3 text-xs">
          <T id="hobbyPlanUpgrade" />
        </p>
      )}
    </section>
  );
}
