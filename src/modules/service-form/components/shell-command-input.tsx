import { useRef } from 'react';

import { Input } from '@koyeb/design-system';
import { formatCommand, parseCommand } from 'src/application/parse-command';
import { Extend } from 'src/utils/types';

import { OverridableField } from './overridable-input';

type CommandInputProps = Extend<
  React.ComponentProps<typeof Input>,
  {
    value: string[] | null;
    onChange: (value: string[] | null) => void;
  }
>;

export function ShellCommandInput({ value, onChange, ...props }: CommandInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <OverridableField
      override={value !== null}
      onOverride={(override) => {
        onChange(override ? [] : null);

        if (!override && ref.current) {
          ref.current.value = '';
        }
      }}
    >
      {(disabled) => (
        <Input
          ref={ref}
          defaultValue={formatCommand(value ?? [])}
          onChange={(event) => onChange(parseCommand(event.target.value))}
          disabled={disabled}
          {...props}
        />
      )}
    </OverridableField>
  );
}
