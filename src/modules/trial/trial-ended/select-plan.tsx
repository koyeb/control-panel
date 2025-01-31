import { DialogFooter, DialogHeader } from '@koyeb/design-system';
import { ExternalLink } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

import { PlanItem } from './plan-item';

const T = createTranslate('modules.trial.ended.selectPlan');

type SelectPlanProps = {
  onDowngrade: () => void;
  onSelected: (plan: 'starter' | 'pro' | 'scale') => void;
};

export function SelectPlan({ onDowngrade, onSelected }: SelectPlanProps) {
  return (
    <>
      <DialogHeader title={<T id="title" />} />

      <div className="col gap-8">
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="grid items-center gap-4 sm:grid-cols-3">
        <PlanItem plan="starter" onUpgrade={() => onSelected('starter')} />
        <PlanItem plan="pro" popular onUpgrade={() => onSelected('pro')} />
        <PlanItem plan="scale" onUpgrade={() => onSelected('scale')} />
      </div>

      <DialogFooter className="!block text-dim">
        <T
          id="footer"
          values={{
            reachOut: (children) => (
              <ExternalLink
                openInNewTab
                href="https://app.reclaim.ai/m/koyeb-intro/short-call"
                className="underline"
              >
                {children}
              </ExternalLink>
            ),
            downgrade: (children) => (
              <button type="button" onClick={onDowngrade} className="underline">
                {children}
              </button>
            ),
          }}
        />
      </DialogFooter>
    </>
  );
}
