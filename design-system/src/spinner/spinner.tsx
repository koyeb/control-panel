import clsx from 'clsx';

type SpinnerProps = {
  ref?: React.Ref<SVGSVGElement>;
  progress?: number;
  className?: string;
};

export function Spinner({ ref, progress, className }: SpinnerProps) {
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
}

const circumference = Math.PI * (24 - 4);

const props: React.SVGProps<SVGCircleElement> = {
  cx: 12,
  cy: 12,
  r: 10,
  strokeWidth: 3,
};
