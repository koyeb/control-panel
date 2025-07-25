import clsx from 'clsx';

type ScalingConfigValueProps = {
  disabled: boolean;
  label: React.ReactNode;
  description: React.ReactNode;
  padding?: boolean;
  error?: React.ReactNode;
  input: React.ReactNode;
};

export function ScalingConfigValue({
  disabled,
  label,
  description,
  padding = true,
  error,
  input,
}: ScalingConfigValueProps) {
  return (
    <div className="col justify-between gap-4 p-3 sm:row sm:items-center">
      <div className="col gap-1">
        <div className={clsx(disabled && 'text-dim')}>{label}</div>

        <div
          className={clsx(
            'text-xs text-dim',
            padding && 'pl-6',
            disabled && 'opacity-70',
            error && 'text-red',
          )}
        >
          {error ?? description}
        </div>
      </div>

      {input}
    </div>
  );
}
