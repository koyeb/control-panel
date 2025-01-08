import clsx from 'clsx';

import { Badge, Button } from '@koyeb/design-system';
import { IconCheck } from 'src/components/icons';
import { PlanIcon } from 'src/components/plan-icon';
import { FormattedPrice } from 'src/intl/formatted';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('modules.trial.ended.planItem');

type PlanItemProps = {
  plan: 'starter' | 'pro' | 'scale';
  popular?: boolean;
  onUpgrade?: () => void;
};

export function PlanItem({ plan, popular, onUpgrade }: PlanItemProps) {
  return (
    <div className={clsx('col rounded-lg border p-4 shadow-lg', popular ? 'gap-10' : 'gap-6')}>
      <div className="row items-center justify-between">
        <PlanIcon plan={plan} className={clsx(popular ? 'text-[#5341AE]' : 'text-green')} />
        {popular && <PopularBadge />}
      </div>

      <div className="col gap-2">
        <div className="font-medium">
          <T
            id="upgrade"
            values={{
              plan: <TranslateEnum enum="plans" value={plan} />,
            }}
          />
        </div>

        <div className="text-dim">
          <T
            id="price"
            values={{
              price: <FormattedPrice value={{ starter: 0, pro: 29, scale: 299 }[plan]} digits={0} />,
            }}
          />
        </div>
      </div>

      <ul className="col gap-1">
        <PlanFeature text={<T id={`${plan}.feature1`} />} />
        <PlanFeature text={<T id={`${plan}.feature2`} />} />
        <PlanFeature text={<T id={`${plan}.feature3`} />} />
      </ul>

      {onUpgrade && (
        <Button variant={popular ? 'solid' : 'outline'} onClick={onUpgrade}>
          <T id="cta" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />
        </Button>
      )}
    </div>
  );
}

function PlanFeature({ text }: { text: React.ReactNode }) {
  return (
    <li className="row items-center gap-1">
      <div>
        <IconCheck className="size-4 text-green" />
      </div>
      <div className="text-dim">{text}</div>
    </li>
  );
}

function PopularBadge() {
  return (
    <Badge size={1} className="!bg-[#3B00FF]/5 !text-[#180091]/70">
      <T id="popular" />
    </Badge>
  );
}
