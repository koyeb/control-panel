import {
  Dropdown,
  Field,
  FieldHelperText,
  Menu,
  MenuItem,
  UseDropdown,
  UseDropdownProps,
  useDropdown,
} from '@koyeb/design-system/next';
import clsx from 'clsx';
import {
  UseComboboxProps,
  UseComboboxReturnValue,
  UseComboboxStateChangeTypes,
  useCombobox,
} from 'downshift';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import { usePureFunction } from 'src/hooks/lifecycle';
import { inArray } from 'src/utils/arrays';
import { Extend } from 'src/utils/types';

import { ControlledProps } from './helpers/controlled-props';
import { Input } from './input';
import { LabelTooltip } from './label-tooltip';

export type ComboboxContext<T = unknown> = {
  combobox: UseComboboxReturnValue<T>;
  dropdown: UseDropdown;
};

type ComboboxProps<T> = {
  ref?: React.Ref<HTMLInputElement>;
  items: T[];
  getKey?: (item: T) => React.Key;
  itemToString?: (item: T) => string;
  renderItem?: (item: T) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  inputValue?: string;
  onInputValueChange?: (inputValue: string, isSelected: boolean) => void;
  onClosed?: () => void;
  value?: T | null;
  onChange?: (value: T) => void;
  label?: React.ReactNode;
  tooltip?: React.ReactNode;
  size?: 1 | 2 | 3;
  placeholder?: string;
  helperText?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  start?: React.ReactNode;
  end?: React.ReactNode;
  className?: string;

  // override defaults
  combobox?: Omit<UseComboboxProps<T>, 'items'>;
  dropdown?: UseDropdownProps;
  field?: (context: ComboboxContext<T>) => Omit<React.ComponentProps<typeof Field>, 'children'>;
  input?: (context: ComboboxContext<T>) => React.ReactNode;
  menu?: (context: ComboboxContext<T>) => React.ReactNode;
};

export function Combobox<T>({
  ref,
  items,
  getKey,
  itemToString,
  renderItem,
  renderNoItems,
  inputValue,
  onInputValueChange,
  onClosed,
  value,
  onChange,
  label,
  tooltip,
  size,
  placeholder,
  helperText,
  required,
  disabled,
  readOnly,
  invalid,
  start,
  end,
  className,
  ...props
}: ComboboxProps<T>) {
  const combobox = useCombobox({
    items,
    itemToString(item) {
      return item ? (itemToString?.(item) ?? '') : '';
    },
    inputValue,
    onInputValueChange({ inputValue, type }) {
      onInputValueChange?.(inputValue, isItemSelectedType(type));
    },
    selectedItem: value,
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem !== null) {
        onChange?.(selectedItem);
      }
    },
    ...props.combobox,
  });

  const dropdown = useDropdown(combobox.isOpen, {
    offset: 8,
    flip: true,
    matchReferenceSize: true,
  });

  const defaultInput = ({ combobox }: ComboboxContext<T>) => (
    <Input
      {...combobox.getInputProps({ ref, required, disabled, readOnly, type: 'search' })}
      root={{ ref: dropdown.refs.setReference }}
      size={size}
      placeholder={placeholder}
      start={start}
      end={end}
    />
  );

  const defaultMenu = ({ combobox, dropdown }: ComboboxContext<T>) => {
    return (
      <Dropdown dropdown={dropdown} onClosed={onClosed}>
        {items.length === 0 && renderNoItems?.()}

        <Menu
          {...combobox.getMenuProps()}
          className={clsx('max-h-64 overflow-auto', { hidden: items.length === 0 })}
        >
          {items.map((item, index) => (
            <MenuItem
              key={getKey?.(item) ?? index}
              highlighted={index === combobox.highlightedIndex}
              {...combobox.getItemProps({ item: item, index })}
            >
              {renderItem?.(item)}
            </MenuItem>
          ))}
        </Menu>
      </Dropdown>
    );
  };

  const { input = defaultInput, menu = defaultMenu } = props;

  return (
    <Field
      id={props.combobox?.id}
      label={label && <LabelTooltip {...combobox.getLabelProps()} label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={invalid}>{helperText}</FieldHelperText>}
      className={className}
      {...props.field?.({ combobox, dropdown })}
    >
      {input({ combobox, dropdown })}
      {createPortal(menu({ combobox, dropdown }), document.getElementById('root') ?? document.body)}
    </Field>
  );
}

const isItemSelectedType = (type: UseComboboxStateChangeTypes) => {
  return inArray(type, [
    useCombobox.stateChangeTypes.ItemClick,
    useCombobox.stateChangeTypes.InputKeyDownEnter,
    useCombobox.stateChangeTypes.InputBlur,
    useCombobox.stateChangeTypes.ControlledPropUpdatedSelectedItem,
  ]);
};

type ControlledComboboxProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
> = Extend<
  ControlledProps<typeof Combobox<Item>, Form, Name>,
  {
    getValue: (item: Item) => PathValue<Form, Name>;
    onChangeEffect?: (item: Item) => void;
  }
>;

export function ControlledCombobox<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
>({ control, name, items, getValue, onChangeEffect, ...props }: ControlledComboboxProps<Form, Name, Item>) {
  const {
    field: { value, onChange, ...field },
    fieldState: { invalid, error },
  } = useController({ control, name });

  const getValuePure = usePureFunction(getValue);

  const valueToItem = useRef(new Map(items.map((item) => [getValue(item), item])));

  useEffect(() => {
    items.forEach((item) => {
      valueToItem.current.set(getValuePure(item), item);
    });
  }, [items, getValuePure]);

  return (
    <Combobox
      {...field}
      items={items}
      invalid={invalid}
      helperText={error?.message}
      value={valueToItem.current.get(value) ?? null}
      onChange={(item) => {
        onChange(getValue(item));
        onChangeEffect?.(item);
      }}
      {...props}
    />
  );
}
