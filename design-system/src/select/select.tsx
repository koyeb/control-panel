import clsx from 'clsx';
import { useSelect } from 'downshift';
import IconChevronDown from 'lucide-static/icons/chevron-down.svg?react';
import { forwardRef, useMemo } from 'react';

import { Dropdown } from '../dropdown/dropdown';
import { useDropdown } from '../dropdown/use-dropdown';
import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { useId } from '../utils/use-id';

type SelectProps<Item> = {
  open?: boolean;
  size?: 1 | 2 | 3;
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: React.ReactNode;
  className?: string;
  id?: string;
  items: Item[];
  selectedItem?: Item | null;
  onSelectedItemChange?: (value: Item) => void;
  onItemClick?: (item: Item) => void;
  onBlur?: (event: React.FocusEvent) => void;
  getKey: (item: Item) => React.Key;
  itemToString: (item: Item) => string;
  renderItem: (item: Item, index?: number) => React.ReactNode;
  renderSelectedItem?: (item: Item) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
};

export const Select = forwardRef(function Select<Item>(
  {
    open,
    size = 2,
    label,
    helpTooltip,
    helperText,
    error,
    invalid = Boolean(error),
    disabled,
    placeholder,
    className,
    id: idProp,
    items,
    selectedItem: selectedItemProp,
    onSelectedItemChange,
    onItemClick,
    onBlur,
    getKey,
    itemToString,
    renderItem,
    renderNoItems,
    renderSelectedItem = renderItem,
  }: SelectProps<Item>,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const id = useId(idProp);
  const helperTextId = `${id}-helper-text`;

  const {
    isOpen,
    selectedItem,
    highlightedIndex,
    closeMenu,
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
      onSelectedItemChange?.(selectedItem);
    },
    itemToString(item) {
      return item ? itemToString(item) : '';
    },
  });

  const dropdown = useDropdown(isOpen);

  const toggleButtonProps = useMemo(() => {
    return getToggleButtonProps({
      ref: (ref) => {
        dropdown.setReference(ref);

        if (typeof forwardedRef === 'function') {
          forwardedRef(ref);
        } else if (forwardedRef) {
          forwardedRef.current = ref;
        }
      },
      disabled,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropdown.setReference, disabled]);

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
        tabIndex={!disabled ? 0 : undefined}
        className={clsx(
          'row focusable w-full cursor-pointer items-center rounded border bg-inherit -outline-offset-1',
          {
            'opacity-50 !cursor-default bg-muted dark:bg-muted/40': disabled,
            'rounded-b-none outline-none': isOpen,
            'border-red outline-red': invalid,
            'min-h-6': size === 1,
            'min-h-8': size === 2,
            'min-h-10': size === 3,
          },
        )}
        onBlur={(event) => {
          onBlur?.(event);
          closeMenu();
        }}
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
      >
        <div className={clsx('flex-1 px-2')}>
          {selectedItem && renderSelectedItem(selectedItem as Item)}
          {!selectedItem && <span className="select-none text-placeholder">{placeholder ?? <wbr />}</span>}
        </div>

        <IconChevronDown className={clsx('icon mx-1 size-6', isOpen && 'rotate-180')} />
      </div>

      <Dropdown
        dropdown={dropdown}
        items={items}
        selectedItem={selectedItem ?? undefined}
        highlightedIndex={highlightedIndex}
        getMenuProps={getMenuProps}
        getItemProps={getItemProps}
        getKey={getKey}
        renderItem={renderItem}
        renderNoItems={renderNoItems}
        onItemClick={onItemClick}
      />
    </Field>
  );
});
