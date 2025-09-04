import { useCombobox } from 'downshift';

import { Dialog } from 'src/components/dialog';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useMount } from 'src/hooks/lifecycle';
import { useShortcut } from 'src/hooks/shortcut';
import { IconSearch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { CommandPaletteContext, useCommandPaletteContext } from './command-palette-context';
import { useLearnCommands } from './commands/learn';
import { useOrganizationCommands } from './commands/organization';
import { useCreateServicesCommands } from './commands/services';
import { useSettingsCommands } from './commands/settings';
import { Footer } from './components/footer';
import { OptionsList } from './components/options-list';
import { SearchInput } from './components/search-input';
import { useCommandPalette } from './use-command-palette';

const T = createTranslate('modules.commandPalette');

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const newCommandPalette = useFeatureFlag('new-command-palette');

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const palette = useCommandPalette(closeDialog);

  useShortcut(['meta', 'k'], newCommandPalette ? () => openDialog('CommandPalette') : undefined);

  return (
    <CommandPaletteContext value={palette}>
      {children}
      <CommandPaletteDialog />
    </CommandPaletteContext>
  );
}

function CommandPaletteDialog() {
  const t = T.useTranslate();

  const palette = useCommandPaletteContext();
  const registerCommonCommands = useRegisterCommonCommands();

  useMount(() => {
    palette.setIcon(IconSearch);
    palette.setPlaceholder(t('placeholder'));

    registerCommonCommands();

    return () => {
      palette.clear();
    };
  });

  return (
    <Dialog id="CommandPalette" overlayClassName="col !justify-start" onClosed={() => palette.reset()}>
      {(props) => (
        <div
          {...props}
          className="relative top-1/4 w-full max-w-3xl overflow-hidden rounded-lg bg-popover shadow-xl"
        >
          <CommandPaletteContent />
        </div>
      )}
    </Dialog>
  );
}

function CommandPaletteContent() {
  const combobox = useCommandPaletteCombobox();

  return (
    <div>
      <SearchInput combobox={combobox} />
      <OptionsList combobox={combobox} />
      <Footer />
    </div>
  );
}

function useCommandPaletteCombobox() {
  const palette = useCommandPaletteContext();

  return useCombobox({
    isOpen: true,
    items: palette.options,
    selectedItem: null,

    itemToString(item) {
      return item?.label ?? '';
    },

    highlightedIndex: palette.highlightedIndex,
    onHighlightedIndexChange({ highlightedIndex }) {
      palette.setHighlightedIndex(highlightedIndex);
    },

    inputValue: palette.input.value,
    onInputValueChange({ inputValue }) {
      palette.setInputValue(inputValue);
    },

    onSelectedItemChange({ selectedItem }) {
      if (selectedItem) {
        void palette.execute(selectedItem);
      }
    },

    stateReducer(state, { type, changes }) {
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange:
          return { ...changes, highlightedIndex: 0 };

        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return { ...changes, inputValue: state.inputValue, highlightedIndex: state.highlightedIndex };

        default:
          return changes;
      }
    },
  });
}

function useRegisterCommonCommands() {
  const createService = useCreateServicesCommands();
  const organization = useOrganizationCommands();
  const settings = useSettingsCommands();
  const learn = useLearnCommands();

  return () => {
    createService();
    organization();
    settings();
    learn();
  };
}
