import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import sort from 'lodash-es/sortBy';
import uniq from 'lodash-es/uniq';
import { useState } from 'react';
import { useController } from 'react-hook-form';

import {
  Dropdown,
  Field,
  FieldHelperText,
  FieldLabel,
  IconButton,
  InputBox,
  useDropdown,
  useId,
} from '@koyeb/design-system';
import { useApiQueryFn } from 'src/api/use-api';
import { IconBraces } from 'src/components/icons';
import { useFormValues } from 'src/hooks/form';
import { useDebouncedValue } from 'src/hooks/timers';
import { Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';
import { lowerCase } from 'src/utils/strings';

import { serviceFormToDeploymentDefinition } from '../../helpers/service-form-to-deployment';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.environmentVariables');

type EnvironmentVariableValueFieldProps = {
  index: number;
  onCreateSecret: () => void;
  label?: React.ReactNode;
};

export function EnvironmentVariableValueField({ index, label }: EnvironmentVariableValueFieldProps) {
  const t = T.useTranslate();

  const id = useId();
  const helperTextId = `${id}-helper-text`;

  const definition = useDebouncedValue(serviceFormToDeploymentDefinition(useFormValues()), 500);

  const variablesQuery = useQuery({
    ...useApiQueryFn('getServiceVariables', { body: { definition } as never }),
    queryKey: ['getServiceVariables', definition],
    placeholderData: keepPreviousData as never,
    refetchInterval: false,
    select: (result) => uniq(mapServiceVariables(result)),
  });

  const [isOpen, setIsOpen] = useState(false);

  const { field, fieldState } = useController<ServiceForm, `environmentVariables.${number}.value`>({
    name: `environmentVariables.${index}.value`,
  });

  const variableName = useWatchServiceForm(`environmentVariables.${index}.name`);
  const filteredItems = filterItems(variablesQuery.data ?? [], variableName, field.value);

  const { highlightedIndex, getLabelProps, getInputProps, getMenuProps, getItemProps, toggleMenu } =
    useCombobox({
      isOpen,
      onIsOpenChange: ({ isOpen }) => setIsOpen(isOpen),
      id,
      itemToString: String,
      items: filteredItems,
      inputValue: field.value,
      onInputValueChange({ inputValue, type }) {
        if (type === useCombobox.stateChangeTypes.InputChange) {
          field.onChange(inputValue);

          if (regexp.test(inputValue)) {
            setIsOpen(true);
          }
        }
      },
      selectedItem: null,
      onSelectedItemChange({ selectedItem }) {
        field.onChange(field.value.replace(regexp, '') + `{{ ${selectedItem} }}`);
      },
      stateReducer(state, { type, changes }) {
        const { InputClick, InputChange } = useCombobox.stateChangeTypes;

        if (type === InputClick || type === InputChange) {
          return { ...changes, isOpen: false };
        }

        return changes;
      },
    });

  const dropdown = useDropdown(isOpen);

  return (
    <Field
      label={
        label && (
          <FieldLabel htmlFor={id} {...getLabelProps()}>
            {label}
          </FieldLabel>
        )
      }
      helperText={
        <FieldHelperText id={helperTextId} invalid={fieldState.invalid}>
          {fieldState.error?.message}
        </FieldHelperText>
      }
    >
      <InputBox
        boxRef={dropdown.setReference}
        boxClassName={clsx(isOpen && '!rounded-b-none')}
        className="peer"
        placeholder={t('valuePlaceholder')}
        end={<IconButton variant="ghost" color="gray" size={1} Icon={IconBraces} onClick={toggleMenu} />}
        aria-invalid={fieldState.invalid}
        aria-errormessage={helperTextId}
        {...getInputProps(field)}
      />

      <Dropdown
        dropdown={dropdown}
        items={filteredItems}
        selectedItem={undefined}
        highlightedIndex={highlightedIndex}
        getMenuProps={getMenuProps}
        getItemProps={getItemProps}
        getKey={identity}
        renderItem={identity}
        renderNoItems={() => <T id="noVariablesToInterpolate" />}
      />
    </Field>
  );
}

function mapServiceVariables({ secrets, system_env, user_env }: Record<string, string[]>) {
  return [...sort([...system_env!, ...user_env!]), ...secrets!.map((name) => `secret.${name}`)].filter(
    (value) => value !== '',
  );
}

const regexp = /\{\{ *([-.a-zA-Z0-9]*)$/;

function filterItems(items: string[], variableName: string, inputValue: string) {
  const match = regexp.exec(inputValue);

  if (!match) {
    return items;
  }

  const search = lowerCase(match[1] as string);

  if (search === '') {
    return items;
  }

  return items.filter((item) => {
    return item !== variableName && lowerCase(item).includes(search);
  });
}
