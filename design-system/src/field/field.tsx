import clsx from 'clsx';

import { HelpTooltip } from '../help-tooltip/help-tooltip';

type FieldProps = {
  ref?: React.Ref<HTMLDivElement>;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Field({ ref, label, helperText, className, children }: FieldProps) {
  return (
    <div ref={ref} className={clsx('col items-start gap-1.5', className)}>
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
    <span className={clsx('text-xs text-dim', invalid && 'text-red', className)} {...props}>
      {children}
    </span>
  );
}
