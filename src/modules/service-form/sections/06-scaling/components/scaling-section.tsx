import clsx from 'clsx';

import { IconCircleAlert, IconInfo } from 'src/icons';

type ScalingConfigSectionProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  footer: React.ReactNode;
  hasError?: boolean;
  children: React.ReactNode;
};

export function ScalingConfigSection({
  title,
  description,
  footer,
  hasError,
  children,
}: ScalingConfigSectionProps) {
  return (
    <div className={clsx('rounded-md border border-muted/50', hasError && 'border-red')}>
      <div className="col gap-2 rounded-md rounded-t-md bg-muted/50 px-3 py-2">
        <div className="font-medium">{title}</div>
        {description && <div className="text-xs text-dim">{description}</div>}
        <div className="col gap-2 divide-y">{children}</div>
      </div>

      {footer}
    </div>
  );
}

type ScalingConfigSectionFooterProps = {
  variant?: 'default' | 'error';
  text: React.ReactNode;
  cta?: React.ReactNode;
};

export function ScalingConfigSectionFooter({
  variant = 'default',
  text,
  cta,
}: ScalingConfigSectionFooterProps) {
  return (
    <div
      className={clsx(
        'col items-start justify-between gap-2 rounded-b-md px-3 py-2',
        'sm:row sm:items-center',
        {
          'bg-muted': variant === 'default',
          'bg-red/5 text-red': variant === 'error',
        },
      )}
    >
      <div className="row items-center gap-2">
        <div>
          {variant === 'error' && <IconCircleAlert className="size-em text-red" />}
          {variant === 'default' && <IconInfo className="size-em text-blue" />}
        </div>

        {text}
      </div>

      {cta}
    </div>
  );
}
