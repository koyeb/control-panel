import clsx from 'clsx';
import { forwardRef, useCallback, useRef } from 'react';

import { useId } from '../utils/use-id';

type SliderProps<Value extends number | [number, number]> = {
  value?: Value;
  onChange?: (value: Value) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  marks?: boolean;
  min?: number;
  max?: number;
  step?: 1;
  id?: string;
  className?: string;
};

export const Slider = forwardRef(function Slider<Value extends number | [number, number]>(
  {
    value,
    onChange,
    disabled,
    label,
    marks,
    min = 0,
    max = 100,
    step = 1,
    className,
    ...props
  }: SliderProps<Value>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const id = useId(props.id);
  const isRange = Array.isArray(value);

  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (value: Value) => {
      if (disabled) {
        return;
      }

      if (typeof value === 'number' && (value < min || value > max)) {
        return;
      }

      if (Array.isArray(value) && (value[0] < min || value[1] > max || value[0] >= value[1])) {
        return;
      }

      onChange?.(value);
    },
    [disabled, onChange, min, max],
  );

  const onInput = useCallback<React.FormEventHandler<HTMLInputElement>>(
    (event) => {
      if (!fromRef.current || !toRef.current) {
        return;
      }

      let fromValue = fromRef.current.valueAsNumber;
      let toValue = toRef.current.valueAsNumber;

      if (event.target === fromRef.current) {
        fromValue = event.currentTarget.valueAsNumber;
      }

      if (event.target === toRef.current) {
        toValue = event.currentTarget.valueAsNumber;
      }

      handleChange([fromValue, toValue] as Value);
    },
    [handleChange],
  );

  const onMouse = useCallback<React.MouseEventHandler>(
    (event) => {
      if (event.buttons === 0) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const percent = (event.clientX - rect.x) / rect.width;
      const val = Math.floor(percent * (max - min) + min + 0.5);

      if (typeof value === 'number' && val !== value) {
        handleChange(val as Value);
      }

      if (Array.isArray(value)) {
        const fromDist = Math.abs(value[0] - val);
        const toDist = Math.abs(value[1] - val);

        if (fromDist < toDist && val !== value[0]) {
          handleChange([val, value[1]] as Value);
        }

        if (fromDist > toDist && val !== value[1]) {
          handleChange([value[0], val] as Value);
        }
      }
    },
    [min, max, value, handleChange],
  );

  return (
    <div className={clsx('slider focusable-within rounded outline-offset-4', className)}>
      {label && (
        <label htmlFor={id} className="mb-2 inline-block">
          {label}
        </label>
      )}

      {!isRange && (
        <div
          className={clsx(
            'relative box-content h-2 py-2',
            !disabled && 'cursor-pointer',
            disabled && 'opacity-50',
          )}
          onMouseDown={onMouse}
          onMouseMove={onMouse}
        >
          {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
          <div className="absolute h-[inherit] w-full rounded-full bg-inverted/10" />

          <input
            ref={ref}
            id={id}
            type="range"
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            value={Number.isNaN(value) ? min : value}
            onChange={(event) => onChange?.(event.target.valueAsNumber as Value)}
            className="group pointer-events-none absolute m-0 h-2 w-full appearance-none bg-transparent outline-none"
          />
        </div>
      )}

      {isRange && (
        <div
          id={id}
          className={clsx(
            'relative box-content h-2 py-2',
            !disabled && 'cursor-pointer',
            disabled && 'opacity-50',
          )}
          onMouseDown={onMouse}
          onMouseMove={onMouse}
        >
          {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
          <div className="absolute h-[inherit] w-full rounded-full bg-inverted/10">
            <div className="relative h-full bg-inverted/50" style={connector(min, max, value)} />
          </div>

          <input
            ref={fromRef}
            type="range"
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            value={Number.isNaN(value[0]) ? min : value[0]}
            onInput={onInput}
            // eslint-disable-next-line tailwindcss/no-arbitrary-value
            className="pointer-events-none absolute top-3 z-[1] m-0 h-0 w-full appearance-none bg-transparent outline-none"
          />

          <input
            ref={toRef}
            type="range"
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            value={Number.isNaN(value[1]) ? max : value[1]}
            onInput={onInput}
            className="pointer-events-none absolute m-0 h-2 w-full appearance-none bg-transparent outline-none"
          />
        </div>
      )}

      {marks && <Marks disabled={disabled} min={min} max={max} step={step} />}
    </div>
  );
});

function connector(min: number, max: number, [from, to]: [number, number]) {
  const left = 100 * ((from - min) / (max - min));
  const right = 100 * ((to - min) / (max - min));

  return {
    left: `${left}%`,
    width: `${right - left}%`,
  };
}

type MarksProps = {
  disabled?: boolean;
  min: number;
  max: number;
  step: number;
};

function Marks({ disabled, min, max, step }: MarksProps) {
  return (
    <div className={clsx('row justify-between text-xs font-semibold', disabled && 'text-dim')}>
      {Array(Math.floor((max - min + 1) / step))
        .fill(null)
        .map((_, index) => index + min)
        .map((index) => (
          <span key={index} className="w-4 text-center">
            {index}
          </span>
        ))}
    </div>
  );
}
