import { useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';

import { DropdownMenu, ExternalLinkMenuItem } from 'src/components/dropdown-menu';
import {
  IconBookMarked,
  IconBookOpen,
  IconChevronRight,
  IconLightbulb,
  IconMessageCircleMore,
  IconNewspaper,
  IconSignal,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.helpLinks');

export function HelpLinks({ collapsed }: { collapsed: boolean }) {
  const isMobile = !useBreakpoint('sm');

  return (
    <DropdownMenu
      openOnHover
      dropdown={{
        offset: 8,
        floating: {
          placement: isMobile ? 'top-end' : 'right-end',
          strategy: 'fixed',
        },
      }}
      reference={(props) => (
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
    >
      <ExternalLinkMenuItem openInNewTab href="https://koyeb.com/docs">
        <IconBookMarked className="icon" />
        <T id="documentation" />
      </ExternalLinkMenuItem>

      <ExternalLinkMenuItem openInNewTab href="https://community.koyeb.com">
        <IconMessageCircleMore className="icon" />
        <T id="community" />
      </ExternalLinkMenuItem>

      <ExternalLinkMenuItem openInNewTab href="https://feedback.koyeb.com">
        <IconLightbulb className="icon" />
        <T id="feedback" />
      </ExternalLinkMenuItem>

      <ExternalLinkMenuItem openInNewTab href="https://status.koyeb.com">
        <IconSignal className="icon" />
        <T id="status" />
      </ExternalLinkMenuItem>

      <ExternalLinkMenuItem openInNewTab href="https://www.koyeb.com/changelog">
        <IconNewspaper className="icon" />
        <T id="changelog" />
      </ExternalLinkMenuItem>

      <ExternalLinkMenuItem openInNewTab href="https://www.koyeb.com/blog">
        <IconBookOpen className="icon" />
        <T id="blog" />
      </ExternalLinkMenuItem>
    </DropdownMenu>
  );
}
