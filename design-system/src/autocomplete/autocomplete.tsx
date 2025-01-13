import clsx from 'clsx';
import { useCombobox } from 'downshift';
import IconChevronDown from 'lucide-static/icons/chevron-down.svg?react';
import { forwardRef, useMemo } from 'react';

import { Dropdown } from '../dropdown/dropdown';
import { useDropdown } from '../dropdown/use-dropdown';
import { Field, FieldHelperText, FieldLabel } from '../field/field';
import { InputBox } from '../input/input';
import { useId } from '../utils/use-id';

type AutocompleteProps<Item> = {
  open?: boolean;
  size?: 1 | 2 | 3;
  label?: React.ReactNode;
  helpTooltip?: React.ReactNode;
  helperText?: React.ReactNode;
  placeholder?: string;
  error?: React.ReactNode;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  items: Item[];
  selectedItem?: Item | null;
  onSelectedItemChange?: (item: Item) => void;
  inputValue?: string;
  onInputValueChange?: (value: string, isItemSelected: boolean) => void;
  resetOnBlur?: boolean;
  onBlur?: (event: React.FocusEvent) => void;
  getKey: (item: NonNullable<Item>) => React.Key;
  itemToString: (item: NonNullable<Item>) => string;
  renderItem: (item: Item, index?: number) => React.ReactNode;
  renderNoItems?: () => React.ReactNode;
};

export const Autocomplete = forwardRef(function Autocomplete<Item>(
  {
    open,
    size,
    label,
    helpTooltip,
    helperText,
    placeholder,
    error,
    invalid = Boolean(error),
    required,
    disabled,
    className,
    id: idProp,
    name,
    items,
    selectedItem,
    onSelectedItemChange,
    inputValue,
    onInputValueChange,
    resetOnBlur = true,
    onBlur,
    getKey,
    itemToString,
    renderItem,
    renderNoItems,
  }: AutocompleteProps<Item>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const id = useId(idProp);
  const helperTextId = `${id}-helper-text`;

  const {
    isOpen,
    highlightedIndex,
    getLabelProps,
    getToggleButtonProps,
    getInputProps,
    getMenuProps,
    getItemProps,
  } = useCombobox({
    isOpen: open,
    id,
    items,
    inputValue,
    onInputValueChange({ inputValue, type }) {
      const isItemSelected = [
        '__item_click__',
        '__input_keydown_enter__',
        '__input_blur__',
        '__controlled_prop_updated_selected_item__',
      ].includes(type);

      if (inputValue !== undefined) {
        onInputValueChange?.(inputValue, isItemSelected);
      }
    },
    selectedItem,
    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        onSelectedItemChange?.(selectedItem);
      }
    },
    itemToString(item) {
      return item ? itemToString(item) : '';
    },
    stateReducer: (state, action) => {
      const { type, changes } = action;

      if (type === useCombobox.stateChangeTypes.InputBlur && resetOnBlur) {
        return {
          ...changes,
          inputValue: state.selectedItem ? itemToString(state.selectedItem) : '',
        };
      }

      return changes;
    },
  });

  const toggleButtonProps = useMemo(
    () => getToggleButtonProps({ disabled }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled],
  );

  const dropdown = useDropdown(isOpen);

  return (
    <Field
      label={
        <FieldLabel htmlFor={id} helpTooltip={helpTooltip} {...getLabelProps()}>
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
      <InputBox
        boxRef={dropdown.setReference}
        type="search"
        size={size}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
        end={
          <button type="button" className="rounded-e" {...toggleButtonProps}>
            <IconChevronDown className={clsx('icon mx-1', isOpen && 'rotate-180')} />
          </button>
        }
        boxClassName={clsx('outline-none', isOpen && '!rounded-b-none')}
        className="peer"
        aria-invalid={invalid}
        aria-errormessage={helperTextId}
        {...getInputProps({ ref, id, onBlur, required })}
      />

      <Dropdown
        dropdown={dropdown}
        items={items}
        highlightedIndex={highlightedIndex}
        getMenuProps={getMenuProps}
        getItemProps={getItemProps}
        getKey={getKey as (item: Item) => React.Key}
        renderItem={renderItem}
        renderNoItems={renderNoItems}
      />
    </Field>
  );
});
