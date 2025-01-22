import { useEffect, useState } from 'react';

import { Input } from '@koyeb/design-system';
import { Extend } from 'src/utils/types';

type StringArrayInputProps = Extend<
  React.ComponentProps<typeof Input>,
  {
    value?: string[];
    onChange?: (value: string[]) => void;
  }
>;

export function StringArrayInput({ value, onChange, ...props }: StringArrayInputProps) {
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
      {...props}
      value={valueStr}
      onChange={(event) => setValueStr(event.target.value)}
      onBlur={() => onChange?.(parseArray(valueStr))}
    />
  );
}

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
