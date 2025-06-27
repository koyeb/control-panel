import { Input } from '@koyeb/design-system';
import { useRef } from 'react';

import { formatCommand, parseCommand } from 'src/application/parse-command';
import { Extend } from 'src/utils/types';

import { OverridableField } from './overridable-input';

type CommandInputProps = Extend<
  React.ComponentProps<typeof Input>,
  {
    instruction: string;
    value: string[] | null;
    onChange: (value: string[] | null) => void;
  }
>;

export function ShellCommandInput({ instruction, value, onChange, ...props }: CommandInputProps) {
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
          helperText={<HelperText instruction={instruction} command={value} />}
          {...props}
        />
      )}
    </OverridableField>
  );
}

type HelperTextProps = {
  instruction: string;
  command: string[] | null;
};

function HelperText({ instruction, command }: HelperTextProps) {
  if (command === null) {
    return null;
  }

  return <code>{`${instruction} [${command.map((value) => `"${value}"`).join(', ')}]`}</code>;
}
