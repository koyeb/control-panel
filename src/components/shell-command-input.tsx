import { Input } from '@koyeb/design-system';
import { useRef } from 'react';

import { formatCommand, parseCommand } from 'src/application/parse-command';
import { OverridableField } from 'src/components/overridable-input';
import { Extend } from 'src/utils/types';

import { LabelTooltip } from './controlled';

type CommandInputProps = Extend<
  React.ComponentProps<typeof Input>,
  {
    tooltip?: React.ReactNode;
    instruction: string;
    value: string[] | null;
    onChange: (value: string[] | null) => void;
  }
>;

export function ShellCommandInput({
  instruction,
  value,
  label,
  tooltip,
  onChange,
  ...props
}: CommandInputProps) {
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
          label={label ? <LabelTooltip label={label} tooltip={tooltip} /> : null}
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
