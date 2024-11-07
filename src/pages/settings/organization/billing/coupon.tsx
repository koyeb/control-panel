import { useForm } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useTrackEvent } from 'src/application/analytics';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.organizationSettings.billing.coupon');

export function Coupon() {
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: {
      coupon: '',
    },
  });

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
        <ControlledInput label={<T id="couponLabel" />} control={form.control} name="coupon" />

        <Button type="submit" disabled={form.formState.isSubmitted}>
          <Translate id={form.formState.isSubmitted ? 'common.sent' : 'common.send'} />
        </Button>
      </form>
    </section>
  );
}
