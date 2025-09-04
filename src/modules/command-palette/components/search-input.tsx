import { Spinner } from '@koyeb/design-system';
import { UseComboboxReturnValue } from 'downshift';

import { useCommandPaletteContext } from '../command-palette-context';
import { PaletteOption } from '../use-command-palette';

export function SearchInput({ combobox }: { combobox: UseComboboxReturnValue<PaletteOption> }) {
  const palette = useCommandPaletteContext();
  const { Icon, placeholder, value } = palette.input;

  return (
    <div className="row items-center gap-2 border-b px-3">
      {Icon && (
        <div>
          <Icon className="size-5 text-dim" />
        </div>
      )}

      <input
        autoFocus
        placeholder={placeholder}
        size={3}
        className="w-full py-3 outline-none"
        {...combobox.getInputProps({
          onKeyDown(event) {
            if (value === '') {
              if ((event.key === 'ArrowLeft' || event.key === 'Backspace') && palette.canGoBack) {
                palette.back();
              }

              const option = palette.highlightedOption;

              if (event.key == 'ArrowRight' && option?.hasSubOptions) {
                void palette.execute(option);
              }
            }
          },
        })}
      />

      {palette.loading && (
        <div>
          <Spinner className="size-5 text-dim" />
        </div>
      )}
    </div>
  );
}
