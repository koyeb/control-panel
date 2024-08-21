import clsx from 'clsx';

import { createArray } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';

export function OnboardingStepper({ step }: { step: 1 | 2 | 3 }) {
  const isCompletedStep = (index: number) => index + 1 <= step;
  const isCurrentStep = (index: number) => index + 1 === step;

  return (
    <div className="row h-1 items-stretch gap-1">
      {createArray<number>(3, identity).map((index) => (
        <div
          key={index}
          className={clsx('w-20 rounded', {
            'bg-inverted/20': isCurrentStep(index),
            'bg-green': isCompletedStep(index),
            'bg-muted': !isCurrentStep(index) && !isCompletedStep(index),
          })}
        />
      ))}
    </div>
  );
}
