import { Button, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { notify } from 'src/application/notify';
import { PaymentForm } from 'src/components/payment-form';
import { createTranslate, Translate, TranslateEnum } from 'src/intl/translate';

import { PlanItem } from './plan-item';

const T = createTranslate('modules.trial.ended.upgrade');

export function Upgrade({ plan, onCancel }: { plan: 'starter' | 'pro' | 'scale'; onCancel: () => void }) {
  const t = T.useTranslate();

  return (
    <>
      <DialogHeader title={<T id="title" />} />

      <p className="text-dim">
        <T id="description" />
      </p>

      <div className="row items-start gap-8">
        <PlanItem plan={plan} />

        <PaymentForm
          plan={plan}
          onPlanChanged={() =>
            notify.success(t('successNotification', { plan: <TranslateEnum enum="plans" value={plan} /> }))
          }
          renderFooter={(formState) => (
            <DialogFooter>
              <Button color="gray" onClick={onCancel}>
                <Translate id="common.back" />
              </Button>

              <Button type="submit" loading={formState.isSubmitting}>
                <T id="submit" />
              </Button>
            </DialogFooter>
          )}
        />
      </div>
    </>
  );
}
