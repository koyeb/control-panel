import clsx from 'clsx';

import { Badge, Button, Dialog2, DialogFooter, DialogHeader } from '@koyeb/design-system';
import { IconCheck } from 'src/components/icons';
import { PlanIcon } from 'src/components/plan-icon';
import { createTranslate, TranslateEnum } from 'src/intl/translate';

const T = createTranslate('modules.trial.endedDialog');

export function TrialEndedDialog() {
  return (
    <Dialog2 open className="col w-full max-w-4xl gap-6">
      <DialogHeader title={<T id="title" />} />

      <div className="col gap-8">
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-3">
        <PlanItem plan="starter" />
        <PlanItem plan="pro" popular />
        <PlanItem plan="scale" />
      </div>

      <DialogFooter className="!block text-dim">
        <T
          id="footer"
          values={{
            reachOut: (children) => <span className="underline">{children}</span>,
            create: (children) => <span className="underline">{children}</span>,
          }}
        />
      </DialogFooter>
    </Dialog2>
  );
}

function PlanItem({ plan, popular }: { plan: 'starter' | 'pro' | 'scale'; popular?: boolean }) {
  return (
    <div className={clsx('col rounded-lg border p-4 shadow-lg', popular ? 'gap-10' : 'gap-6')}>
      <div className="row items-center justify-between">
        <PlanIcon plan={plan} className={clsx(popular ? 'text-[#5341AE]' : 'text-green')} />
        {popular && (
          <Badge size={1} className="bg-[#3B00FF]/5 text-[#180091]/70">
            <T id="popular" />
          </Badge>
        )}
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
          <T id="price" values={{ price: { starter: 0, pro: 29, scale: 299 }[plan] }} />
        </div>
      </div>

      <ul className="col gap-1">
        <PlanFeature text={<T id={`${plan}.feature1`} />} />
        <PlanFeature text={<T id={`${plan}.feature2`} />} />
        <PlanFeature text={<T id={`${plan}.feature3`} />} />
      </ul>

      <Button variant={popular ? 'solid' : 'outline'}>
        <T id="cta" values={{ plan: <TranslateEnum enum="plans" value={plan} /> }} />
      </Button>
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
