import { Floating, Menu, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import {
  IconBookMarked,
  IconBookOpen,
  IconChevronRight,
  IconLightbulb,
  IconMessageCircleMore,
  IconNewspaper,
  IconSignal,
} from 'src/components/icons';
import { ExternalLinkMenuItem } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.helpLinks');

export function HelpLinks({ collapsed }: { collapsed: boolean }) {
  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  useEffect(() => {
    onClose();
  }, [collapsed]);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      hover
      placement={isMobile ? 'top-end' : 'right-end'}
      strategy="fixed"
      offset={8}
      renderReference={(props) => (
        <div
          className={clsx(
            'mx-4 row items-center gap-1',
            'rounded-md border py-1 pr-2 pl-3',
            'transition-colors hover:bg-muted/50',
            'text-xs font-medium text-dim',
          )}
          {...props}
        >
          {!collapsed && <T id="label" />}

          <div className="ms-auto">
            <IconChevronRight className="size-4 text-dim" />
          </div>
        </div>
      )}
      renderFloating={(props) => (
        <Menu className="min-w-52" {...props}>
          <LinkMenuItem href="https://koyeb.com/docs" onClick={onClose}>
            <IconBookMarked className="icon" />
            <T id="documentation" />
          </LinkMenuItem>

          <LinkMenuItem href="https://community.koyeb.com" onClick={onClose}>
            <IconMessageCircleMore className="icon" />
            <T id="community" />
          </LinkMenuItem>

          <LinkMenuItem href="https://feedback.koyeb.com" onClick={onClose}>
            <IconLightbulb className="icon" />
            <T id="feedback" />
          </LinkMenuItem>

          <LinkMenuItem href="https://status.koyeb.com" onClick={onClose}>
            <IconSignal className="icon" />
            <T id="status" />
          </LinkMenuItem>

          <LinkMenuItem href="https://www.koyeb.com/changelog" onClick={onClose}>
            <IconNewspaper className="icon" />
            <T id="changelog" />
          </LinkMenuItem>

          <LinkMenuItem href="https://www.koyeb.com/blog" onClick={onClose}>
            <IconBookOpen className="icon" />
            <T id="blog" />
          </LinkMenuItem>
        </Menu>
      )}
    />
  );
}

type LinkMenuItemProps = {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
};

function LinkMenuItem({ href, onClick, children }: LinkMenuItemProps) {
  return (
    <ExternalLinkMenuItem openInNewTab href={href} onClick={onClick}>
      {children}
    </ExternalLinkMenuItem>
  );
}
