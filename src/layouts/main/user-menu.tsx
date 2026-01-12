import { Collapse, useBreakpoint } from '@koyeb/design-system';
import { useAuth } from '@workos-inc/authkit-react';
import clsx from 'clsx';
import { useState } from 'react';

import { useUser } from 'src/api';
import { withStopPropagation } from 'src/application/dom-events';
import { ButtonMenuItem, DropdownMenu, LinkMenuItem } from 'src/components/dropdown-menu';
import { UserAvatar } from 'src/components/user-avatar';
import { useSetThemeMode, useThemeMode } from 'src/hooks/theme';
import {
  IconCheck,
  IconChevronRight,
  IconLaptop,
  IconLogOut,
  IconMoon,
  IconSunDim,
  IconUser,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.userMenu');

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { signOut } = useAuth();
  const user = useUser();
  const isMobile = !useBreakpoint('sm');

  return (
    <DropdownMenu
      openOnHover
      dropdown={{
        offset: 8,
        floating: {
          placement: isMobile ? 'top-end' : 'left-end',
        },
      }}
      reference={(props) => (
        <div
          className="row items-center gap-2 py-2 pr-2 pl-3 text-start transition-colors hover:bg-muted/50"
          {...props}
        >
          <UserAvatar user={user} />

          {!collapsed && <span className="flex-1 truncate font-medium">{user?.name}</span>}

          {!collapsed && (
            <span>
              <IconChevronRight className="size-4 text-dim" />
            </span>
          )}
        </div>
      )}
    >
      <LinkMenuItem to="/user/settings" className="row gap-2">
        <IconUser className="icon" />
        <T id="userSettings" />
      </LinkMenuItem>

      <ThemeMenuItem />

      <ButtonMenuItem onClick={() => signOut()}>
        <IconLogOut className="icon" />
        <T id="logout" />
      </ButtonMenuItem>
    </DropdownMenu>
  );
}

function ThemeMenuItem() {
  const [open, setOpen] = useState(false);
  const themeMode = useThemeMode();
  const setThemeMode = useSetThemeMode();

  return (
    <>
      <ButtonMenuItem onClick={withStopPropagation(() => setOpen(!open))}>
        <IconSunDim className="icon" />
        <T id="theme" />
        <IconChevronRight className={clsx('ms-auto icon', open && 'rotate-90')} />
      </ButtonMenuItem>

      <Collapse open={open}>
        <div className="col items-stretch border-y">
          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode('light')}>
            <IconSunDim className="icon" />
            <T id="light" />
            {themeMode === 'light' && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode('dark')}>
            <IconMoon className="icon" />
            <T id="dark" />
            {themeMode === 'dark' && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode('system')}>
            <IconLaptop className="icon" />
            <T id="system" />
            {themeMode === 'system' && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>
        </div>
      </Collapse>
    </>
  );
}
