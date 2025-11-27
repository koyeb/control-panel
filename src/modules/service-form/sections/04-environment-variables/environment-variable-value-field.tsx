import {
  Dropdown,
  Field,
  FieldHelperText,
  IconButton,
  Input,
  Menu,
  MenuItem,
  useDropdown,
} from '@koyeb/design-system';
import clsx from 'clsx';
import { useCombobox } from 'downshift';
import { Fragment, useRef, useState } from 'react';
import { useController } from 'react-hook-form';

import { DocumentationLink } from 'src/components/documentation-link';
import { LabelTooltip } from 'src/components/forms/label-tooltip';
import { useFormValues } from 'src/hooks/form';
import { IconChevronDown } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { lowerCase } from 'src/utils/strings';

import { useServiceVariables } from '../../helpers/service-variables';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.environmentVariables');

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

  const variables = useServiceVariables(useFormValues<ServiceForm>());

  const [isOpen, setIsOpen] = useState(false);

  const { field, fieldState } = useController<ServiceForm, `environmentVariables.${number}.value`>({
    name: `environmentVariables.${index}.value`,
  });

  const variableName = useWatchServiceForm(`environmentVariables.${index}.name`);

  type Group = { key: React.Key; label: React.ReactNode; items: string[] };

  const groups: Group[] = [
    {
      key: 'secrets',
      label: 'Secrets',
      items: filterItems(variables?.secrets ?? [], variableName, field.value),
    },
    {
      key: 'userEnv',
      label: 'Service variables',
      items: filterItems(variables?.userEnv ?? [], variableName, field.value),
    },
    {
      key: 'systemEnv',
      label: 'Koyeb variables',
      items: filterItems(variables?.systemEnv ?? [], variableName, field.value),
    },
    {
      key: 'create',
      label: 'Create new',
      items: ['__new_secret__'],
    },
  ];

  const items = groups.flatMap((group) => group.items);

  const inputRef = useRef<HTMLInputElement>(null);

  const { highlightedIndex, getLabelProps, getInputProps, getMenuProps, getItemProps, toggleMenu } =
    useCombobox({
      isOpen,
      onIsOpenChange: ({ isOpen }) => setIsOpen(isOpen),
      itemToString: String,
      items,
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

  const dropdown = useDropdown({
    floating: { open: isOpen },
    offset: 8,
    flip: true,
    matchReferenceSize: true,
  });

  const tooltip = (
    <T
      id="valueTooltip"
      values={{
        documentationLink: (children) => (
          <DocumentationLink path="/docs/build-and-deploy/environment-variables#environment-variable-and-secret-interpolation">
            {children}
          </DocumentationLink>
        ),
        code: (children) => <code>{children}</code>,
      }}
    />
  );

  return (
    <Field
      label={label && <LabelTooltip {...getLabelProps()} label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={fieldState.invalid}>{fieldState.error?.message}</FieldHelperText>}
    >
      <Input
        placeholder={t('valuePlaceholder')}
        invalid={fieldState.invalid}
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
        root={{
          ref: dropdown.refs.setReference,
          className: clsx(isOpen && 'rounded-b-none!'),
        }}
        {...getInputProps({ ...field, ref: inputRef })}
      />

      <Dropdown dropdown={dropdown}>
        <Menu {...getMenuProps()} className="max-h-64 overflow-y-auto">
          {
            groups.reduce(
              (result: { sections: React.ReactNode[]; offset: number }, { key, label, items }) => {
                result.sections.push(
                  <Fragment key={key}>
                    {items.length > 0 && (
                      <MenuItem className="pointer-events-none font-medium text-dim">{label}</MenuItem>
                    )}

                    {items.map((item, index) => (
                      <MenuItem
                        {...getItemProps({ item, index: index + result.offset })}
                        key={item}
                        highlighted={index + result.offset === highlightedIndex}
                      >
                        {item === '__new_secret__' ? <T id="createSecret" /> : item}
                      </MenuItem>
                    ))}
                  </Fragment>,
                );

                result.offset += items.length;

                return result;
              },
              { sections: [], offset: 0 },
            ).sections
          }
        </Menu>
      </Dropdown>
    </Field>
  );
}

const regexp = /{{(((?!}}).)*)$/i;

function filterItems(items: string[], variableName: string, inputValue: string) {
  const match = regexp.exec(inputValue)?.[1]?.trim();

  if (match === undefined) {
    return items;
  }

  return items.filter((item) => {
    return item !== variableName && lowerCase(item).includes(lowerCase(match));
  });
}
