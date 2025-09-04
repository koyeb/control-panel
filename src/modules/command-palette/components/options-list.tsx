import clsx from 'clsx';
import { UseComboboxReturnValue } from 'downshift';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react/jsx-runtime';

import { BoxSkeleton } from 'src/components/skeleton';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { useCommandPaletteContext } from '../command-palette-context';
import { PaletteOption } from '../use-command-palette';

const T = createTranslate('modules.commandPalette');

export function OptionsList({ combobox }: { combobox: UseComboboxReturnValue<PaletteOption> }) {
  const palette = useCommandPaletteContext();

  if (palette.options.length === 0) {
    if (palette.loading) {
      return <Skeleton />;
    }

    return <NoResults />;
  }

  const contexts = [{ id: undefined, label: null }, ...palette.contexts];

  return (
    <div {...combobox.getMenuProps()} className="col max-h-96 gap-2 overflow-y-auto py-2">
      {contexts.map((context) => (
        <Fragment key={context.id ?? ''}>
          {context.label && <div className="px-3 text-xs font-bold text-dim">{context.label}</div>}

          {palette.options.filter(hasProperty('contextId', context.id)).map((option) => (
            <OptionItem
              key={option.id}
              option={option}
              isHighlighted={palette.options.indexOf(option) === combobox.highlightedIndex}
              props={combobox.getItemProps({ item: option, index: palette.options.indexOf(option) })}
            />
          ))}
        </Fragment>
      ))}
    </div>
  );
}

type OptionItemProps = {
  option: PaletteOption;
  isHighlighted: boolean;
  props: Record<string, unknown>;
};

function OptionItem({ option, isHighlighted, props }: OptionItemProps) {
  const { Icon, label, description, hasSubOptions } = option;

  return (
    <div
      className={clsx('mx-1 row items-center gap-3 rounded-md px-2 py-2', isHighlighted && 'bg-muted')}
      {...props}
    >
      {Icon && (
        <div>
          <Icon className="size-6 text-dim" />
        </div>
      )}

      <div className="col flex-1 gap-1">
        <div>{label}</div>
        {description && <div className="text-xs text-dim">{description}</div>}
      </div>

      {hasSubOptions && (
        <div>
          <ChevronRight className="size-4" />
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="col gap-2 px-3">
      {Array(4)
        .fill(null)
        .map((_, index) => (
          <BoxSkeleton key={index} className="h-10 w-full" />
        ))}
    </div>
  );
}

function NoResults() {
  const palette = useCommandPaletteContext();

  return (
    <div className="flex min-h-20 items-center justify-center text-dim">
      <T id="noResults" values={{ search: palette.input.value }} />
    </div>
  );
}
