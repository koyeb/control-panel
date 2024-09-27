import { keepPreviousData, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import sort from 'lodash-es/sortBy';
import uniq from 'lodash-es/uniq';
import { useRef, useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';

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
import { DocumentationLink } from 'src/components/documentation-link';
import { IconChevronDown } from 'src/components/icons';
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

export function EnvironmentVariableValueField({
  index,
  onCreateSecret,
  label,
}: EnvironmentVariableValueFieldProps) {
  const t = T.useTranslate();

  const id = useId();
  const helperTextId = `${id}-helper-text`;

  const values = useFormContext<ServiceForm>().getValues();

  const variablesQuery = useQuery({
    ...useApiQueryFn('getServiceVariables', {
      body: { definition: serviceFormToDeploymentDefinition(values) },
      delay: 500,
    }),
    placeholderData: keepPreviousData as never,
    refetchInterval: false,
    select: (result) => uniq(mapServiceVariables(result)),
  });

  const [isOpen, setIsOpen] = useState(false);

  const { field, fieldState } = useController<ServiceForm, `environmentVariables.${number}.value`>({
    name: `environmentVariables.${index}.value`,
  });

  const variableName = useWatchServiceForm(`environmentVariables.${index}.name`);

  const filteredItems = [
    '__new_secret__',
    ...filterItems(variablesQuery.data ?? [], variableName, field.value),
  ];

  const inputRef = useRef<HTMLInputElement>(null);

  const { highlightedIndex, getLabelProps, getInputProps, getMenuProps, getItemProps, toggleMenu } =
    useCombobox({
      isOpen,
      onIsOpenChange: ({ isOpen }) => setIsOpen(isOpen),
      id,
      itemToString: String,
      items: filteredItems,
      inputValue: field.value,
      selectedItem: null,
      onSelectedItemChange({ selectedItem }) {
        if (selectedItem === '__new_secret__') {
          onCreateSecret();
        } else {
          const value = field.value;
          const input = inputRef.current;
          const pos = input?.selectionStart;

          if (value.match(regexp)) {
            field.onChange(value.replace(regexp, '') + `{{ ${selectedItem} }}`);
          } else if (pos !== null) {
            field.onChange(`${value.slice(0, pos)}{{ ${selectedItem} }}${value.slice(pos)}`);
          } else {
            field.onChange(`{{ ${selectedItem} }}`);
          }
        }
      },
      stateReducer(state, { type, changes, inputValue }) {
        const { InputClick, InputChange } = useCombobox.stateChangeTypes;

        if (type === InputChange) {
          return { ...changes, isOpen: regexp.test(inputValue ?? '') };
        }

        if (type === InputClick) {
          return { ...changes, isOpen: state.isOpen };
        }

        return changes;
      },
    });

  const dropdown = useDropdown(isOpen);

  const tooltip = (
    <T
      id="valueTooltip"
      values={{
        documentationLink: (children) => (
          <DocumentationLink path="/docs/build-and-deploy/environment-variables#environment-variable-interpolation">
            {children}
          </DocumentationLink>
        ),
        code: (children) => <code>{children}</code>,
      }}
    />
  );

  return (
    <Field
      label={
        label && (
          <FieldLabel htmlFor={id} helpTooltip={tooltip} {...getLabelProps()}>
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
        end={
          <IconButton
            variant="ghost"
            color="gray"
            size={1}
            Icon={IconChevronDown}
            onClick={toggleMenu}
            className={clsx(isOpen && 'rotate-180')}
          />
        }
        aria-invalid={fieldState.invalid}
        aria-errormessage={helperTextId}
        {...getInputProps({ ...field, ref: inputRef })}
      />

      <Dropdown
        dropdown={dropdown}
        items={filteredItems}
        selectedItem={undefined}
        highlightedIndex={highlightedIndex}
        getMenuProps={getMenuProps}
        getItemProps={getItemProps}
        getKey={identity}
        renderItem={(item) => (item === '__new_secret__' ? <T id="createSecret" /> : item)}
        renderNoItems={() => <T id="noVariablesToInterpolate" />}
      />
    </Field>
  );
}

function mapServiceVariables({ secrets, system_env, user_env }: Record<string, string[]>) {
  return [
    //
    ...sort([...system_env!, ...user_env!]),
    ...secrets!.map((name) => `secret.${name}`),
  ].filter((value) => value !== '');
}

const regexp = /{{(((?!}}).)*)$/i;

function filterItems(items: string[], variableName: string, inputValue: string) {
  const match = regexp.exec(inputValue)?.[1];

  if (match === undefined) {
    return items;
  }

  return items.filter((item) => {
    return item !== variableName && lowerCase(item).includes(lowerCase(match));
  });
}
