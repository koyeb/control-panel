import { useState, useEffect, forwardRef } from 'react';

import { Input } from '@koyeb/design-system';

type StringArrayInputProps = Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> & {
  value?: string[];
  onChange?: (value: string[]) => void;
};

export const StringArrayInput = forwardRef(function StringArrayInput(
  { value, onChange, ...props }: StringArrayInputProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const [valueStr, setValueStr] = useState('');

  useEffect(() => {
    if (value?.length === 0) {
      setValueStr('');
    } else {
      setValueStr(JSON.stringify(value));
    }
  }, [value]);

  return (
    <Input
      ref={ref}
      {...props}
      value={valueStr}
      onChange={(event) => setValueStr(event.target.value)}
      onBlur={() => onChange?.(parseArray(valueStr))}
    />
  );
});

function parseArray(input: string): string[] {
  if (input === '') {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(input);

    if (Array.isArray(parsed)) {
      return parsed.map(String);
    }
  } catch {
    //
  }

  return input.split(' ');
}
