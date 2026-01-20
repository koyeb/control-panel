import {
  Badge,
  Dropdown,
  Field,
  FieldHelperText,
  Menu,
  MenuItem,
  SelectToggleButton,
  UseDropdown,
  UseDropdownProps,
  useDropdown,
} from '@koyeb/design-system';
import clsx from 'clsx';
import {
  UseSelectProps,
  UseSelectReturnValue,
  UseSelectState,
  UseSelectStateChangeOptions,
  useSelect,
} from 'downshift';
import merge from 'lodash-es/merge';
import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FieldPath, FieldValues, PathValue, useController } from 'react-hook-form';

import { usePureFunction } from 'src/hooks/lifecycle';
import { Translate } from 'src/intl/translate';
import { Extend } from 'src/utils/types';

import { ControlledProps } from './helpers/controlled-props';
import { LabelTooltip } from './label-tooltip';

type SelectContext<T = unknown> = {
  select: UseSelectReturnValue<T>;
  dropdown: UseDropdown;
};

type SelectProps<T> = {
  ref?: React.Ref<HTMLDivElement>;
  items: T[];
  getKey?: (item: T) => React.Key;
  itemToString?: (item: T) => string;
  renderValue?: (item: T | null) => React.ReactNode;
  renderItem?: (item: T) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  onItemClick?: (item: T) => void;
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

  // override defaults
  select?: Omit<UseSelectProps<T>, 'items'>;
  dropdown?: UseDropdownProps;
  field?: (context: SelectContext<T>) => Omit<React.ComponentProps<typeof Field>, 'children'>;
  toggleButton?: (context: SelectContext<T>) => React.ReactNode;
  menu?: (context: SelectContext<T>) => React.ReactNode;
};

export function Select<T>(props: SelectProps<T>) {
  const { renderValue, renderItem } = props;

  const toggleButtonValue = (value: T | null) => {
    if (renderValue) {
      return renderValue(value);
    }

    if (value !== null) {
      return renderItem?.(value);
    }
  };

  const { ref, size, placeholder, disabled, readOnly, invalid } = props;

  const defaultToggleButton = (context: SelectContext<T>) => (
    <SelectToggleButton
      {...context}
      ref={ref}
      size={size}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      invalid={invalid}
    >
      {toggleButtonValue(context.select.selectedItem)}
    </SelectToggleButton>
  );

  const { getKey, renderNoItems, onItemClick } = props;

  const defaultMenu = (context: SelectContext<T>) => (
    <Dropdown dropdown={context.dropdown} className="max-h-48 overflow-auto">
      {items.length === 0 && renderNoItems?.()}

      <Menu {...context.select.getMenuProps()} className={clsx({ hidden: items.length === 0 })}>
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
  );

  const { items, value, itemToString, onChange } = props;

  const select = useSelect({
    items,
    selectedItem: value,
    itemToString(item) {
      return item ? (itemToString?.(item) ?? '') : '';
    },
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        onChange?.(selectedItem);
      }
    },
    ...props.select,
  });

  const dropdown = useDropdown(
    merge(
      {
        floating: { open: select.isOpen },
        offset: 8,
        flip: true,
        matchReferenceSize: true,
      },
      props.dropdown,
    ),
  );

  const { label, tooltip, helperText, className } = props;
  const { toggleButton = defaultToggleButton, menu = defaultMenu } = props;

  const root = document.getElementById('root') ?? document.body;

  return (
    <Field
      id={props.select?.id}
      label={label && <LabelTooltip {...select.getLabelProps()} label={label} tooltip={tooltip} />}
      helperText={<FieldHelperText invalid={invalid}>{helperText}</FieldHelperText>}
      className={className}
      {...props.field?.({ select, dropdown })}
    >
      {toggleButton({ select, dropdown })}
      {createPortal(menu({ select, dropdown }), root)}
    </Field>
  );
}

type MultiSelectMenuProps<T> = {
  context: SelectContext<T>;
  items: T[];
  selected: T[];
  onSelectAll: () => void;
  onClearAll: () => void;
  getKey?: (item: T) => React.Key;
  renderItem?: (item: T, selected: boolean) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  onItemClick?: (item: T) => void;
  className?: string;
};

export function MultiSelectMenu<T>({
  context,
  items,
  selected,
  onSelectAll,
  onClearAll,
  getKey,
  renderItem,
  renderNoItems,
  onItemClick,
  className,
}: MultiSelectMenuProps<T>) {
  const ref = useClickAway(
    [context.dropdown.refs.reference.current as Element, context.dropdown.refs.floating.current],
    context.select.closeMenu,
  );

  return (
    <Dropdown ref={ref} dropdown={context.dropdown} className={className}>
      <div className="row justify-between border-b px-6 py-3">
        <button
          type="button"
          disabled={selected.length === items.length}
          onClick={onSelectAll}
          className="text-xs font-medium disabled:text-dim"
        >
          <Translate id="common.selectAll" />
        </button>

        <button
          type="button"
          disabled={selected.length === 0}
          onClick={onClearAll}
          className="text-xs font-medium disabled:text-dim"
        >
          <Translate id="common.clearAll" />
        </button>
      </div>

      {items.length === 0 && renderNoItems?.()}

      <Menu {...context.select.getMenuProps()}>
        {items.map((item, index) => (
          <MenuItem
            {...context.select.getItemProps({ item, index, onClick: () => onItemClick?.(item) })}
            key={getKey?.(item) ?? index}
            highlighted={index === context.select.highlightedIndex}
          >
            {renderItem?.(item, selected.includes(item))}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  );
}

export function SelectedCountBadge({ selected, total }: { selected: number; total: number }) {
  return (
    <Badge size={1} className="min-w-10">
      <Translate id="common.selectedCount" values={{ selected, total }} />
    </Badge>
  );
}

function useClickAway(elements: Array<Element | null>, cb: () => void) {
  const refs = useRef<Array<Element | null>>([]);

  refs.current = [...elements];

  return useCallback(() => {
    const onClick = (event: MouseEvent) => {
      const isInside = refs.current.some((ref) => ref?.contains(event.target as Element));

      if (!isInside) {
        cb();
      }
    };

    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
    };
  }, [cb]);
}

// eslint-disable-next-line react-refresh/only-export-components
export function multiSelectStateReducer<T>(
  state: UseSelectState<T>,
  { type, changes }: UseSelectStateChangeOptions<T>,
) {
  switch (type) {
    case useSelect.stateChangeTypes.ToggleButtonBlur:
    case useSelect.stateChangeTypes.ItemClick:
      return { ...changes, isOpen: true, highlightedIndex: state.highlightedIndex };

    default:
      return changes;
  }
}

type ControlledSelectProps<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
> = Extend<
  ControlledProps<typeof Select<Item>, Form, Name>,
  {
    getValue: (item: Item) => PathValue<Form, Name>;
    onChangeEffect?: (item: Item) => void;
  }
>;

export function ControlledSelect<
  Form extends FieldValues = FieldValues,
  Name extends FieldPath<Form> = FieldPath<Form>,
  Item = PathValue<Form, Name>,
>({ control, name, items, getValue, onChangeEffect, ...props }: ControlledSelectProps<Form, Name, Item>) {
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
    <Select
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
