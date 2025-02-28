import clsx from 'clsx';

type StepperProps = {
  totalSteps: number;
  activeStep: number;
  onClick?: (index: number) => void;
};

export function Stepper({ totalSteps, activeStep, onClick }: StepperProps) {
  return (
    <div className="row">
      {Array(totalSteps)
        .fill(null)
        .map((_, index) => (
          <button
            key={index}
            type="button"
            disabled={onClick === undefined}
            onClick={() => onClick?.(index)}
            className="px-2 py-1"
          >
            <div
              className={clsx('h-1 w-10 rounded-full transition-colors', {
                'bg-inverted/75': index <= activeStep,
                'bg-inverted/25': index > activeStep,
              })}
            />
          </button>
        ))}
    </div>
  );
}
