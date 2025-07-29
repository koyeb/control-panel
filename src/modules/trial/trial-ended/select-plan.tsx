import { DialogFooter, DialogHeader } from '@koyeb/design-system';

import { ExternalLink, Link } from 'src/components/link';
import { tallyForms, useTallyLink } from 'src/hooks/tally';
import { createTranslate } from 'src/intl/translate';

import { PlanItem } from './plan-item';

const T = createTranslate('modules.trial.ended.selectPlan');

type SelectPlanProps = {
  onDowngrade: () => void;
  onSelected: (plan: 'starter' | 'pro' | 'scale') => void;
};

export function SelectPlan({ onDowngrade, onSelected }: SelectPlanProps) {
  const tallyLink = useTallyLink(tallyForms.getInTouch);

  return (
    <>
      <div className="row justify-between gap-4">
        <DialogHeader title={<T id="title" />} />
        <Link to="/" search={{ settings: '' }} className="text-dim hover:underline">
          <T id="manageAccount" />
        </Link>
      </div>

      <div className="col gap-8">
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      <div className="grid items-center gap-4 md:grid-cols-3">
        <PlanItem plan="starter" onUpgrade={() => onSelected('starter')} />
        <PlanItem plan="pro" popular onUpgrade={() => onSelected('pro')} />
        <PlanItem plan="scale" onUpgrade={() => onSelected('scale')} />
      </div>

      <DialogFooter className="!block text-dim">
        <T
          id="footer"
          values={{
            reachOut: (children) => (
              <ExternalLink openInNewTab href={tallyLink} className="underline">
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
