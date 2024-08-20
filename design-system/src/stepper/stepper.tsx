import clsx from 'clsx';
import { Children } from 'react';

type StepperProps = {
  children: Array<React.ReactElement<StepProps>>;
};

export function Stepper({ children }: StepperProps) {
  const steps = Children.map(children, (child) => {
    return {
      active: Boolean(child.props.active),
      label: child.props.children,
      onClick: child.props.onClick,
    };
  });

  const activeIndex = steps.findIndex((step) => step.active);

  return (
    <div>
      <div className="row gap-3">
        {steps.map((step, index) => (
          <button
            key={index}
            type="button"
            disabled={step.onClick === undefined}
            onClick={step.onClick}
            className={clsx('flex-1 border-t-2 border-solid pt-1.5', index <= activeIndex && 'border-green')}
          />
        ))}
      </div>

      <div className="row max-w-full items-center gap-2 overflow-visible whitespace-nowrap">
        {steps[activeIndex]?.label}
      </div>
    </div>
  );
}

type StepProps = {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
};

export function Step(_props: StepProps) {
  return null;
}
