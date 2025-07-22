import { Spinner } from '@koyeb/design-system';
import { useCombobox } from 'downshift';
import { useEffect, useMemo } from 'react';

import { stopPropagation } from 'src/application/dom-events';
import { Dialog } from 'src/components/dialog';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useShortcut } from 'src/hooks/shortcut';
import { IconChevronRight } from 'src/icons';

import { PaletteItem, useCommandPaletteContext } from './command-palette.provider';
import { useRegisterDefaultItems } from './register-default-commands';

export function CommandPalette() {
  const openDialog = Dialog.useOpen();
  const newCommandPalette = useFeatureFlag('new-command-palette');

  useShortcut(['meta', 'k'], newCommandPalette ? () => openDialog('CommandPalette') : undefined);

  useRegisterDefaultItems();

  return (
    <Dialog id="CommandPalette" overlayClassName="col !justify-start">
      {(props) => (
        <div
          {...props}
          onKeyDown={stopPropagation}
          className="relative top-1/4 w-full max-w-3xl overflow-hidden rounded-lg bg-popover shadow-xl"
        >
          <CommandPaletteContent />
        </div>
      )}
    </Dialog>
  );
}

function CommandPaletteContent() {
  const { defaultItems, items, setItems, inputValue, setInputValue, loading } = useCommandPaletteContext();
  const closeDialog = Dialog.useClose();

  const filteredItems = useMemo(() => {
    return (items ?? Array.from(defaultItems))
      .filter(filter(inputValue))
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  }, [items, defaultItems, inputValue]);

  useEffect(() => {
    return () => {
      setItems(undefined);
      setInputValue('');
    };
  }, [setItems, setInputValue]);

  const combobox = useCombobox({
    isOpen: true,
    items: filteredItems,
    selectedItem: null,
    defaultHighlightedIndex: 0,
    itemToString(item) {
      return item?.label ?? '';
    },
    inputValue,
    onInputValueChange({ inputValue }) {
      setInputValue(inputValue);
    },
    onSelectedItemChange({ selectedItem }) {
      selectedItem?.execute();

      if (!selectedItem?.keepOpen) {
        closeDialog();
      }
    },
    stateReducer(state, { type, changes }) {
      switch (type) {
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue, highlightedIndex: state.highlightedIndex };

        default:
          return changes;
      }
    },
  });

  const { setHighlightedIndex } = combobox;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredItems, setHighlightedIndex]);

  return (
    <>
      <div className="row items-center gap-2 border-b px-2">
        <IconChevronRight className="size-4 text-dim" />

        <input
          autoFocus
          type="search"
          placeholder="Type a command..."
          className="w-full bg-transparent py-2 outline-none"
          {...combobox.getInputProps({
            onKeyDown: (event) => {
              if (event.key === 'Escape') {
                if (combobox.inputValue === '') {
                  closeDialog();
                } else {
                  setInputValue('');
                }
              }

              if (event.key === 'Backspace' && combobox.inputValue === '') {
                setItems(undefined);
              }
            },
          })}
        />

        {loading && <Spinner className="size-4 text-dim" />}
      </div>

      <ul
        {...combobox.getMenuProps()}
        className="max-h-96 scrollbar-thin scroll-my-2 overflow-auto p-2 scrollbar-green"
      >
        {filteredItems.map((item) => (
          <li
            key={item.label}
            className="col cursor-pointer gap-0.5 rounded p-1 aria-selected:bg-muted/50"
            {...combobox.getItemProps({ item })}
          >
            {item.render?.()}

            {!item.render && (
              <>
                <div>{item.label}</div>
                {item.description && <div className="text-xs text-dim">{item.description}</div>}
              </>
            )}
          </li>
        ))}

        {filteredItems.length === 0 && (
          <li className="col min-h-12 items-center justify-center text-dim">No results</li>
        )}
      </ul>
    </>
  );
}

const filter = (inputValue: string) => (command: PaletteItem) => {
  if (inputValue === '') {
    return true;
  }

  return command.keywords.some((keyword) => keyword.includes(inputValue.toLowerCase()));
};
