import clsx from 'clsx';
import { forwardRef } from 'react';

import { FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type CheckboxOwnProps = {
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
};

type CheckboxProps = CheckboxOwnProps &
  Omit<React.ComponentProps<typeof CheckboxInput>, 'type' | keyof CheckboxOwnProps>;

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

export const CheckboxInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & { indeterminate?: boolean }
>(function CheckboxInput({ indeterminate, ...props }, ref) {
  return (
    <>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />

      <span className="leading-none peer-checked:hidden peer-disabled:[&>span]:bg-muted">
        <span className="inline-block size-4 rounded border" />
      </span>

      <span className="hidden leading-none peer-checked:block">
        {indeterminate ? <Indeterminate className="size-4" /> : <Checked className="size-4" />}
      </span>
    </>
  );
});

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

function Indeterminate(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M0 4C0 1.79086 1.79086 0 4 0H12C14.2091 0 16 1.79086 16 4V12C16 14.2091 14.2091 16 12 16H4C1.79086 16 0 14.2091 0 12V4Z"
        fill="#059669"
        fillOpacity="0.1"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M5.33337 8.00013C5.33337 7.70558 5.57216 7.4668 5.86671 7.4668H10.1334C10.4279 7.4668 10.6667 7.70558 10.6667 8.00013C10.6667 8.29468 10.4279 8.53346 10.1334 8.53346H5.86671C5.57216 8.53346 5.33337 8.29468 5.33337 8.00013Z"
        fill="#059669"
      />
      <path
        d="M0.5 4C0.5 2.067 2.067 0.5 4 0.5H12C13.933 0.5 15.5 2.067 15.5 4V12C15.5 13.933 13.933 15.5 12 15.5H4C2.067 15.5 0.5 13.933 0.5 12V4Z"
        stroke="#059669"
      />
    </svg>
  );
}
