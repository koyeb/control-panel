import { useForm } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { useOrganization } from 'src/api/hooks/session';
import { notify } from 'src/application/notify';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { handleSubmit } from 'src/hooks/form';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.coupon');

export function Coupon() {
  const organization = useOrganization();
  const t = T.useTranslate();

  const form = useForm({
    defaultValues: {
      coupon: '',
    },
  });

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <form
        onSubmit={handleSubmit(form, ({ coupon }) => {
          // eslint-disable-next-line no-console
          console.log('Sending coupon code to API:', coupon);
          form.reset();
          notify.success(t('couponSent'));
        })}
        className="row max-w-md items-center gap-4"
      >
        <ControlledInput control={form.control} name="coupon" className="w-full" />

        <Button type="submit">
          <Translate id="common.send" />
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
