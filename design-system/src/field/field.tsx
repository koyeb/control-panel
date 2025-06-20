import clsx from 'clsx';

import { HelpTooltip } from '../help-tooltip/help-tooltip';

type FieldProps = {
  ref?: React.Ref<HTMLDivElement>;
  label?: React.ReactNode;
  labelPosition?: 'top' | 'left';
  helperText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Field({ ref, label, labelPosition = 'top', helperText, className, children }: FieldProps) {
  return (
    <div
      ref={ref}
      className={clsx(
        'gap-x-2 gap-y-1.5',
        {
          'col items-start': labelPosition === 'top',
          'grid grid-cols-[auto_1fr] items-center': labelPosition === 'left',
        },
        className,
      )}
    >
      {label}
      {children}
      {helperText}
    </div>
  );
}

type FieldLabelProps = React.LabelHTMLAttributes<HTMLLabelElement> & {
  helpTooltip?: React.ReactNode;
};

export function FieldLabel({ helpTooltip, className, children, ...props }: FieldLabelProps) {
  if (!children) {
    return null;
  }

  const label = (
    <label className={className} {...props}>
      {children}
    </label>
  );

  if (!helpTooltip) {
    return label;
  }

  return (
    <div className="inline-flex flex-row items-center gap-2">
      {label}
      <HelpTooltip>{helpTooltip}</HelpTooltip>
    </div>
  );
}

type FieldHelperTextProps = React.HTMLAttributes<HTMLSpanElement> & {
  invalid?: boolean;
};

export function FieldHelperText({ className, children, invalid, ...props }: FieldHelperTextProps) {
  if (!children) {
    return null;
  }

  return (
    <span className={clsx('col-span-2 text-xs text-dim', invalid && 'text-red', className)} {...props}>
      {children}
    </span>
  );
}
