import clsx from 'clsx';
import { forwardRef } from 'react';

import { FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type CheckboxOwnProps = {
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
};

type CheckboxProps = CheckboxOwnProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | keyof CheckboxOwnProps>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, helpTooltip, className, ...props },
  ref,
) {
  const id = useId(props.id);

  return (
    <FieldLabel
      id={`${id}-label`}
      htmlFor={id}
      helpTooltip={helpTooltip}
      className={clsx(
        'inline-flex flex-row items-center gap-2',
        'focusable-within rounded outline-offset-4',
        !props.disabled && 'cursor-pointer',
        props.disabled && 'text-dim',
        className,
      )}
    >
      <CheckboxInput ref={ref} {...props} id={id} />
      {label}
    </FieldLabel>
  );
});

export const CheckboxInput = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function CheckboxInput(props, ref) {
    return (
      <>
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />

        <span className="leading-none peer-checked:hidden peer-disabled:[&>span]:bg-muted">
          <span className="inline-block size-4 rounded border" />
        </span>

        <span className="hidden leading-none peer-checked:block">
          <Checked className="size-4" />
        </span>
      </>
    );
  },
);

function Checked(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" {...props}>
      <path
        className="fill-green"
        d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4Z"
      />
      <path
        className="stroke-neutral"
        d="M12 5L6.5 10.5L4 8"
        fill="none"
        strokeWidth="1.6666"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
