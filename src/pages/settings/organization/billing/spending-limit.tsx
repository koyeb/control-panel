import { useForm } from 'react-hook-form';

import { Button, InputStart } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { SectionHeader } from 'src/components/section-header';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, Translate } from 'src/intl/translate';

const T = createTranslate('pages.organizationSettings.billing.spendingLimit');

export function SpendingAlerts() {
  const form = useForm<{ limit: number }>({
    defaultValues: { limit: 100 },
  });

  return (
    <section className="col gap-6">
      <SectionHeader title={<T id="title" />} description={<T id="description" />} />

      <T id="currentLimit" values={{ value: <FormattedPrice value={100} digits={0} /> }} />

      <form className="row gap-4">
        <ControlledInput
          control={form.control}
          name="limit"
          type="number"
          className="w-full max-w-xs"
          start={
            <InputStart>
              <T id="inputStart" />
            </InputStart>
          }
        />

        <Button type="submit" loading={false}>
          <Translate id="common.save" />
        </Button>
      </form>
    </section>
  );
}
