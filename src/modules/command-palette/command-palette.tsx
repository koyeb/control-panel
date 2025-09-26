import { CommandPalette, CommandPaletteComponent, useCommandPalette } from '@koyeb/design-system';
import clsx from 'clsx';
import { useRef } from 'react';

import { hasMessage } from 'src/api/api-errors';
import { notify } from 'src/application/notify';
import { Dialog } from 'src/components/dialog';
import { BoxSkeleton } from 'src/components/skeleton';
import { useMount } from 'src/hooks/lifecycle';
import { useShortcut } from 'src/hooks/shortcut';
import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp, IconSearch } from 'src/icons';
import { createTranslate, useTranslate } from 'src/intl/translate';

import { CommandPaletteContext } from './command-palette-context';
import { useLearnCommands } from './commands/learn';
import { useOrganizationCommands } from './commands/organization';
import { useServicesCommands } from './commands/services';
import { useSettingsCommands } from './commands/settings';

const T = createTranslate('modules.commandPalette');

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslate();

  const openDialog = Dialog.useOpen();
  const closeDialog = Dialog.useClose();

  const palette = useCommandPalette({
    onSuccess: closeDialog,
    onError: (error) => notify.error(hasMessage(error) ? error.message : t('common.unknownError')),
  });

  const initialize = useInitialize();

  useMount(() => initialize(palette));

  useShortcut(['meta', 'k'], () => {
    openDialog('CommandPalette');
  });

  return (
    <CommandPaletteContext value={palette}>
      {children}

      <Dialog id="CommandPalette" overlayClassName="col !justify-start" onClosed={() => palette.reset()}>
        {(props) => (
          <div
            {...props}
            className="relative top-1/4 h-112 w-full max-w-3xl overflow-hidden rounded-lg bg-popover shadow-xl"
          >
            <CommandPaletteComponent
              palette={palette}
              noResults={() => <NoResults palette={palette} />}
              footer={() => <Footer />}
            />
          </div>
        )}
      </Dialog>
    </CommandPaletteContext>
  );
}

function useInitialize() {
  const t = T.useTranslate();

  const services = useServicesCommands();
  const organization = useOrganizationCommands();
  const settings = useSettingsCommands();
  const learn = useLearnCommands();

  const initialized = useRef(false);

  return (palette: CommandPalette) => {
    // react strict mode
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    palette.setIcon(IconSearch);
    palette.setPlaceholder(t('placeholder'));

    services(palette);
    organization(palette);
    settings(palette);
    learn(palette);
  };
}

function NoResults({ palette }: { palette: CommandPalette }) {
  if (palette.loading) {
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

  return (
    <div className="flex flex-1 items-center justify-center text-dim">
      <T id="noResults" values={{ search: palette.input.value }} />
    </div>
  );
}

function Footer() {
  return (
    <div className="row items-center gap-4 border-t p-3">
      <FooterItem
        label="Close"
        shortcut={
          <span className="text-xs font-medium">
            <T id="footer.escape" />
          </span>
        }
        className="mr-auto"
      />

      <FooterItem label={<T id="footer.up" />} shortcut={<IconChevronUp className="size-3" />} />
      <FooterItem label={<T id="footer.down" />} shortcut={<IconChevronDown className="size-3" />} />
      <FooterItem label={<T id="footer.left" />} shortcut={<IconChevronLeft className="size-3" />} />
      <FooterItem label={<T id="footer.right" />} shortcut={<IconChevronRight className="size-3" />} />
    </div>
  );
}

type FooterItemProps = {
  label: React.ReactNode;
  shortcut: React.ReactNode;
  className?: string;
};

function FooterItem({ label, shortcut, className }: FooterItemProps) {
  return (
    <div className={clsx('row items-center gap-2', className)}>
      <div className="text-dim">{label}</div>
      <kbd className="rounded-md border px-2 py-1">{shortcut}</kbd>
    </div>
  );
}
