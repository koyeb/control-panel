import clsx from 'clsx';
import { forwardRef } from 'react';

import { FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type RadioOwnProps = {
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
};

type RadioProps = RadioOwnProps &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | keyof RadioOwnProps>;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(function Radio(
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
      <RadioInput ref={ref} {...props} id={id} />
      {label}
    </FieldLabel>
  );
});

export const RadioInput = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  function RadioInput(props, ref) {
    return (
      <>
        <input ref={ref} type="radio" className="peer sr-only" {...props} />

        <span className="leading-none peer-checked:hidden  peer-disabled:[&>span]:bg-muted">
          <span className="inline-block size-4 rounded-full border" />
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
        d="M0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8Z"
        className="fill-green"
      />
      <circle cx="8" cy="8" r="2" className="fill-neutral" />
    </svg>
  );
}
