import IconBookMarked from 'lucide-static/icons/book-marked.svg?react';
import IconBookOpen from 'lucide-static/icons/book-open.svg?react';
import IconChevronRight from 'lucide-static/icons/chevron-right.svg?react';
import IconLightbulb from 'lucide-static/icons/lightbulb.svg?react';
import IconMessageMoreCircle from 'lucide-static/icons/message-circle-more.svg?react';
import IconNewspaper from 'lucide-static/icons/newspaper.svg?react';
import IconSignal from 'lucide-static/icons/signal.svg?react';
import IconUsers from 'lucide-static/icons/users.svg?react';
import { useEffect, useState } from 'react';

import { Floating, Menu, MenuItem } from '@koyeb/design-system';
import { ExternalLink } from 'src/components/link';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.helpLinks');

export function HelpLinks({ collapsed }: { collapsed: boolean }) {
  const [open, setOpen] = useState(false);
  const onClose = () => setOpen(false);

  useEffect(() => {
    onClose();
  }, [collapsed]);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      placement="left"
      renderReference={(ref, props) => (
        <button
          ref={ref}
          type="button"
          className="row mx-3 items-center gap-2 p-2 text-left text-dim hover:text-default"
          onClick={() => setOpen(true)}
          {...props}
        >
          <div>
            <IconUsers className="size-6" />
          </div>
          {!collapsed && (
            <>
              <span className="flex-1 font-medium">
                <T id="label" />
              </span>
              <IconChevronRight className="size-6" />
            </>
          )}
        </button>
      )}
      renderFloating={(ref, props) => (
        <Menu ref={ref} className="min-w-52" {...props}>
          <LinkMenuItem href="https://koyeb.com/docs" onClick={onClose}>
            <IconBookMarked className="icon" />
            <T id="documentation" />
          </LinkMenuItem>

          <LinkMenuItem href="https://community.koyeb.com" onClick={onClose}>
            <IconMessageMoreCircle className="icon" />
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
    <MenuItem element={ExternalLink} openInNewTab href={href} onClick={onClick}>
      {children}
    </MenuItem>
  );
}
