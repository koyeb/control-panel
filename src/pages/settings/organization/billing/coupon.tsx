import { useForm } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { useTrackEvent } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.organizationSettings.billing.coupon');

export function Coupon() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: {
      coupon: '',
    },
  });

  const disabled = organization.plan === 'hobby' || form.formState.isSubmitted;

  const track = useTrackEvent();

  const handleSubmit = (value: string) => {
    track('coupon', { value });
    form.reset();
    notify.success(t('couponSent'));
  };

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <form
        onSubmit={form.handleSubmit(({ coupon }) => handleSubmit(coupon))}
        className="col sm:row max-w-md gap-4 sm:items-end"
      >
        <ControlledInput
          label={<T id="couponLabel" />}
          control={form.control}
          name="coupon"
          disabled={disabled}
        />

        <Button type="submit" disabled={disabled}>
          <Translate id={disabled ? 'common.sent' : 'common.send'} />
        </Button>
      </form>

      {disabled && (
        <p className="border-l-4 border-green/50 pl-3 text-xs">
          <T id="hobbyPlanUpgrade" />
        </p>
      )}
    </section>
  );
}
