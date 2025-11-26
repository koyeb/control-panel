import { Badge, Button } from '@koyeb/design-system';
import clsx from 'clsx';

import { PlanIcon } from 'src/components/plan-icon';
import { IconCheck } from 'src/icons';
import { FormattedPrice } from 'src/intl/formatted';
import { TranslateEnum, createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

const T = createTranslate('modules.trial.ended.planItem');

const prices = {
  starter: 0,
  pro: 29 * 100,
  scale: 299 * 100,
};

const features = {
  starter: 5,
  pro: 6,
  scale: 6,
};

type PlanItemProps = {
  plan: 'starter' | 'pro' | 'scale';
  popular?: boolean;
  onUpgrade?: () => void;
  className?: string;
};

export function PlanItem({ plan, popular, onUpgrade, className }: PlanItemProps) {
  return (
    <div
      className={clsx('col gap-6 rounded-lg border p-4 shadow-lg', popular ? 'h-124' : 'h-112', className)}
    >
      <div className="row items-center justify-between">
        <PlanIcon plan={plan} className={clsx(popular ? 'text-purple' : 'text-green')} />
        {popular && <PopularBadge />}
      </div>

      {popular && <div />}

      <div className="col gap-2">
        <div className="font-medium">
          <T id={`${plan}.cta`} values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />
        </div>

        <div className="text-dim">
          <T id="price" values={{ price: <FormattedPrice value={prices[plan]} digits={0} /> }} />
        </div>
      </div>

      <div className="text-dim">
        <T id={`${plan}.description`} />
      </div>

      <ul className="col gap-1">
        {createArray(features[plan], (i) => (
          <PlanFeature text={<T id={`${plan}.feature${(i + 1) as 1}`} />} />
        ))}
      </ul>

      {onUpgrade && (
        <Button variant={popular ? 'solid' : 'outline'} onClick={onUpgrade} className="mt-auto">
          <T id={`${plan}.cta`} values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />
        </Button>
      )}
    </div>
  );
}

function PlanFeature({ text }: { text: React.ReactNode }) {
  return (
    <li className="row items-start gap-1">
      <div className="pt-0.5">
        <IconCheck className="size-4 text-green" />
      </div>
      <div className="text-dim">{text}</div>
    </li>
  );
}

function PopularBadge() {
  return (
    <Badge size={1} className="bg-purple/5 text-purple! dark:bg-purple/50 dark:text-default/70!">
      <T id="popular" />
    </Badge>
  );
}
