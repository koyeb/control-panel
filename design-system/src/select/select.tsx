import clsx from 'clsx';
import { useSelect, UseSelectProps, UseSelectState, UseSelectStateChangeOptions } from 'downshift';
import IconChevronDown from 'lucide-static/icons/chevron-down.svg?react';
import { useCallback, useMemo } from 'react';

import { Dropdown, DropdownGroup } from '../dropdown/dropdown';
import { useDropdown } from '../dropdown/use-dropdown';
import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { Extend } from '../utils/types';
import { useId } from '../utils/use-id';

type SelectProps<Item> = {
  ref?: React.Ref<HTMLDivElement>;
  open?: boolean;
  size?: 1 | 2 | 3;
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: React.ReactNode;
  className?: string;
  id?: string;
  items: Array<Item>;
  groups?: Array<DropdownGroup<Item>>;
  selectedItem?: Item | null;
  onSelectedItemChange?: (value: Item) => void;
  onItemClick?: (item: Item) => void;
  onBlur?: (event: React.FocusEvent) => void;
  getKey: (item: Item) => React.Key;
  itemToString: (item: Item) => string;
  renderItem: (item: Item, index?: number) => React.ReactNode;
  renderSelectedItem?: (item: Item | null) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
  canSelectItem?: (item: Item) => boolean;
  stateReducer?: UseSelectProps<Item>['stateReducer'];
};

export function Select<Item>({
  ref: forwardedRef,
  open,
  size = 2,
  label,
  helpTooltip,
  helperText,
  error,
  invalid = Boolean(error),
  disabled,
  readOnly,
  placeholder,
  className,
  id: idProp,
  items,
  groups,
  selectedItem: selectedItemProp,
  onSelectedItemChange,
  onItemClick,
  onBlur,
  getKey,
  itemToString,
  renderItem,
  renderNoItems,
  renderSelectedItem,
  canSelectItem,
  stateReducer,
}: SelectProps<Item>) {
  const id = useId(idProp);
  const helperTextId = `${id}-helper-text`;

  const {
    isOpen,
    selectedItem,
    highlightedIndex,
    getLabelProps,
    getToggleButtonProps,
    getMenuProps,
    getItemProps,
  } = useSelect({
    id,
    items,
    isOpen: open,
    selectedItem: selectedItemProp,
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        onSelectedItemChange?.(selectedItem);
      }
    },
    itemToString(item) {
      return item ? itemToString(item) : '';
    },
    isItemDisabled(item) {
      return Boolean(canSelectItem && !canSelectItem(item));
    },
    stateReducer(state, options) {
      return stateReducer?.(state, options) ?? options.changes;
    },
  });

  const dropdown = useDropdown(isOpen);
  const dropdownRef = dropdown.setReference;

  const ref = useCallback(
    (ref: HTMLDivElement) => {
      dropdownRef(ref);

      if (typeof forwardedRef === 'function') {
        forwardedRef(ref);
      } else if (forwardedRef != null) {
        forwardedRef.current = ref;
      }
    },
    [dropdownRef, forwardedRef],
  );

  const toggleButtonProps = useMemo(
    () => getToggleButtonProps({ ref, disabled, readOnly, onBlur }),
    [getToggleButtonProps, ref, disabled, readOnly, onBlur],
  );

  return (
    <Field
      label={
        <FieldLabel helpTooltip={helpTooltip} {...getLabelProps()}>
          {label}
        </FieldLabel>
      }
      helperText={
        <FieldHelperText id={helperTextId} invalid={invalid}>
          {error ?? helperText}
        </FieldHelperText>
      }
      className={className}
    >
      <div
        {...toggleButtonProps}
        className={clsx('row w-full items-center rounded border bg-inherit -outline-offset-1', {
          'cursor-pointer focusable': !disabled && !readOnly,
          'pointer-events-none': disabled || readOnly,
          'opacity-50 bg-muted dark:bg-muted/40': disabled,
          'rounded-b-none outline-none': isOpen,
          'border-red outline-red': invalid,
          'min-h-6': size === 1,
          'min-h-8': size === 2,
          'min-h-10': size === 3,
        })}
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
      >
        <div className={clsx('flex-1 px-2')}>
          {renderSelectedItem?.(selectedItem) ?? (
            <>
              {selectedItem && renderItem(selectedItem)}
              {!selectedItem && (
                <span className="select-none text-placeholder">{placeholder ?? <wbr />}</span>
              )}
            </>
          )}
        </div>

        <IconChevronDown className={clsx('icon mx-1 size-6', isOpen && 'rotate-180')} />
      </div>

      <Dropdown
        dropdown={dropdown}
        highlightedIndex={highlightedIndex}
        getMenuProps={getMenuProps}
        getItemProps={getItemProps}
        getKey={getKey}
        renderItem={renderItem}
        renderNoItems={renderNoItems}
        onItemClick={onItemClick}
        {...(groups ? { groups } : { items })}
      />
    </Field>
  );
}

type MultiSelectProps<Item> = Extend<
  SelectProps<Item>,
  {
    selectedItems?: Item[];
    onItemsSelected?: (item: Item) => void;
    onItemsUnselected?: (item: Item) => void;
    renderItem: (item: Item, selected: boolean, index?: number) => React.ReactNode;
    renderSelectedItems: (items: Item[]) => React.ReactNode;
  }
>;

export function MultiSelect<Item>({
  selectedItems = [],
  onItemsSelected,
  onItemsUnselected,
  renderItem,
  renderSelectedItems,
  ...props
}: MultiSelectProps<Item>) {
  return (
    <Select
      selectedItem={null}
      onItemClick={(item) => {
        if (selectedItems.includes(item)) {
          onItemsUnselected?.(item);
        } else {
          onItemsSelected?.(item);
        }
      }}
      renderItem={(item, index) => renderItem(item, selectedItems.includes(item), index)}
      renderSelectedItem={() => renderSelectedItems(selectedItems)}
      stateReducer={multiSelectStateReducer}
      {...props}
    />
  );
}

function multiSelectStateReducer<Item>(
  state: UseSelectState<Item>,
  { changes, type }: UseSelectStateChangeOptions<Item>,
) {
  switch (type) {
    case useSelect.stateChangeTypes.ToggleButtonKeyDownEnter:
    case useSelect.stateChangeTypes.ToggleButtonKeyDownSpaceButton:
    case useSelect.stateChangeTypes.ItemClick:
      return { ...changes, isOpen: true, highlightedIndex: state.highlightedIndex };
  }

  return changes;
}
