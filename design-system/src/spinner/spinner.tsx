import clsx from 'clsx';
import { forwardRef } from 'react';

type SpinnerProps = {
  progress?: number;
  className?: string;
};

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(function Spinner(
  { progress, className },
  ref,
) {
  return (
    <svg
      ref={ref}
      role="progressbar"
      viewBox="0 0 24 24"
      fill="none"
      className={clsx('inline-block -rotate-90', className)}
    >
      <circle className="stroke-current opacity-30" {...props} />
      <circle
        strokeLinecap="round"
        className={clsx('origin-center stroke-current', progress === undefined && 'animate-spin')}
        style={{
          strokeDasharray: circumference,
          strokeDashoffset: circumference * (1 - (progress ?? 0.3)),
        }}
        {...props}
      />
    </svg>
  );
});

const circumference = Math.PI * (24 - 4);

const props: React.SVGProps<SVGCircleElement> = {
  cx: 12,
  cy: 12,
  r: 10,
  strokeWidth: 3,
};
