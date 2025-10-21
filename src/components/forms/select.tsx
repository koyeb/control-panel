import {
  Select as BaseSelect,
  Dropdown,
  FieldHelperText,
  Menu,
  MenuItem,
  SelectToggleButton,
} from '@koyeb/design-system/next';
import { ComponentProps, useMemo } from 'react';
import { FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import { usePureFunction } from 'src/hooks/lifecycle';
import { Extend } from 'src/utils/types';

import { ControlledProps, LabelTooltip } from '../controlled';

type BaseSelectProps<T> = ComponentProps<typeof BaseSelect<T>>;

export type SelectProps<T> = {
  ref?: React.Ref<HTMLDivElement>;
  items: T[];
  getKey?: (item: T) => React.Key;
  itemToString?: (item: T) => string; // todo;
  renderValue?: (item: T) => React.ReactNode;
  renderItem?: (item: T) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  onItemClick?: (item: T) => void;
  toggleButton?: BaseSelectProps<T>['toggleButton'];
  menu?: BaseSelectProps<T>['menu'];
  value?: T | null;
  onChange?: (value: T) => void;
  label?: React.ReactNode;
  tooltip?: React.ReactNode;
  size?: 1 | 2 | 3;
  placeholder?: React.ReactNode;
  helperText?: React.ReactNode;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
  className?: string;
};

export function Select<T>({
  ref,
  items,
  getKey,
  renderValue,
  renderItem,
  renderNoItems,
  onItemClick,
  toggleButton,
  menu,
  value,
  onChange,
  label,
  tooltip,
  size,
  placeholder,
  disabled,
  readOnly,
  invalid,
  helperText,
  className,
}: SelectProps<T>) {
  const toggleButtonValue = (value: T | null) => {
    if (value !== null) {
      return renderValue?.(value) ?? renderItem?.(value);
    }
  };

  return (
    <BaseSelect
      root={document.getElementById('root')}
      field={({ select }) => ({
        label: label ? <LabelTooltip {...select.getLabelProps()} label={label} tooltip={tooltip} /> : null,
        helperText: <FieldHelperText invalid={invalid}>{helperText}</FieldHelperText>,
        className,
      })}
      select={{
        items,
        selectedItem: value,
        onSelectedItemChange({ selectedItem }: { selectedItem: T | null }) {
          if (selectedItem) {
            onChange?.(selectedItem);
          }
        },
      }}
      dropdown={{
        offset: 8,
        flip: true,
        matchReferenceSize: true,
      }}
      toggleButton={(context) =>
        toggleButton?.(context) ?? (
          <SelectToggleButton
            ref={ref}
            size={size}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            invalid={invalid}
          >
            {toggleButtonValue(context.select.selectedItem)}
          </SelectToggleButton>
        )
      }
      menu={(context) =>
        menu?.(context) ?? (
          <Dropdown dropdown={context.dropdown}>
            {items.length === 0 && renderNoItems?.()}

            <Menu {...context.select.getMenuProps()}>
              {items.map((item, index) => (
                <MenuItem
                  {...context.select.getItemProps({ item, index, onClick: () => onItemClick?.(item) })}
                  key={getKey?.(item) ?? index}
                  highlighted={index === context.select.highlightedIndex}
                >
                  {renderItem?.(item)}
                </MenuItem>
              ))}
            </Menu>
          </Dropdown>
        )
      }
    />
  );
}

type ControlledSelectProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
> = Extend<
  ControlledProps<typeof Select<Item>, Form, Name>,
  {
    itemToValue: (item: Item) => PathValue<Form, Name>;
    onChangeEffect?: (item: Item) => void;
  }
>;

export function ControlledSelect<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
>({
  control,
  name,
  itemToValue: getValue,
  onChangeEffect,
  ...props
}: ControlledSelectProps<Form, Name, Item>) {
  const {
    field: { value, onChange, ...field },
    fieldState: { invalid, error },
  } = useController({ control, name });

  const getValuePure = usePureFunction(getValue);

  const valueToItem = useMemo(() => {
    return new Map(props.items.map((item) => [getValuePure(item), item] as const));
  }, [props.items, getValuePure]);

  return (
    <Select
      {...field}
      invalid={invalid}
      helperText={error?.message}
      value={valueToItem.get(value) ?? null}
      onChange={(item) => {
        onChange(getValue(item));
        onChangeEffect?.(value);
      }}
      {...props}
    />
  );
}
