import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';

import { Tooltip } from 'src/components/tooltip';
import { createTranslate } from 'src/intl/translate';
import { entries } from 'src/utils/object';

import { IconCheck } from '../icons';

import { ControlledInput } from './controlled';

const T = createTranslate('components.organizationNameField');

type OrganizationNameFieldProps = {
  form: UseFormReturn<{ organizationName: string }>;
  label: React.ReactNode;
};

export function OrganizationNameField({ form, label }: OrganizationNameFieldProps) {
  const [inputFocused, setInputFocused] = useState(false);

  return (
    <Tooltip
      open={inputFocused}
      allowHover
      arrow={false}
      placement="bottom-start"
      offset={8}
      content={<OrganizationNameTooltip name={form.watch('organizationName')} />}
      className="!bg-muted"
      trigger={(props) => (
        <div {...props}>
          <ControlledInput
            control={form.control}
            name="organizationName"
            label={label}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
        </div>
      )}
    />
  );
}

function OrganizationNameTooltip({ name }: { name: string }) {
  const rules = useMemo(
    () => ({
      maxLength: name !== '' && name.length < 40,
      letters: name !== '' && name.match(/[A-Z]/) === null,
      startEndAlphanumeric:
        name !== '' && name.match(/^[a-z0-9]/) !== null && name.match(/[a-z0-9]$/) !== null,
      whitespace: name !== '' && name.match(/ /) === null,
      alphanumeric: name !== '' && name.match(/^[- A-Za-z0-9]+$/) !== null,
      noConsecutiveDashes: name !== '' && name.match(/--/) === null,
    }),
    [name],
  );

  return (
    <ul className="col gap-1">
      {entries(rules).map(([rule, valid]) => (
        <li
          key={rule}
          className={clsx('row items-center gap-1', valid && 'text-green', !valid && 'text-dim')}
        >
          <IconCheck className="size-em" />
          <T id={rule} />
        </li>
      ))}
    </ul>
  );
}
