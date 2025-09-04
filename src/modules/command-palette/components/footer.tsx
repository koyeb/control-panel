import clsx from 'clsx';

import { IconChevronDown, IconChevronLeft, IconChevronRight, IconChevronUp } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.commandPalette.footer');

export function Footer() {
  return (
    <div className="row items-center gap-4 border-t p-3">
      <FooterItem
        label="Close"
        shortcut={
          <span className="text-xs font-medium">
            <T id="escape" />
          </span>
        }
        className="mr-auto"
      />

      <FooterItem label={<T id="up" />} shortcut={<IconChevronUp className="size-3" />} />
      <FooterItem label={<T id="down" />} shortcut={<IconChevronDown className="size-3" />} />
      <FooterItem label={<T id="left" />} shortcut={<IconChevronLeft className="size-3" />} />
      <FooterItem label={<T id="right" />} shortcut={<IconChevronRight className="size-3" />} />
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
