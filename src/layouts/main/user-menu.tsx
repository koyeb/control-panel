import { ButtonMenuItem, Collapse, Floating, Menu, useBreakpoint } from '@koyeb/design-system';
import clsx from 'clsx';
import { useState } from 'react';

import { useLogoutMutation, useUser } from 'src/api/hooks/session';
import {
  IconCheck,
  IconChevronRight,
  IconLaptop,
  IconLogOut,
  IconMoon,
  IconSunDim,
  IconUser,
} from 'src/components/icons';
import { LinkMenuItem } from 'src/components/link';
import { UserAvatar } from 'src/components/user-avatar';
import { useSetThemeMode, useThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.userMenu');

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const user = useUser();
  const logout = useLogoutMutation('/auth/signin');

  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      hover
      placement={isMobile ? 'top-end' : 'left-end'}
      offset={8}
      renderReference={(props) => (
        <div className="row items-center gap-2 py-2 pr-2 pl-3 transition-colors hover:bg-muted/50" {...props}>
          <UserAvatar user={user} />

          {!collapsed && <span className="flex-1 truncate font-medium">{user.name}</span>}

          {!collapsed && (
            <span>
              <IconChevronRight className="size-4 text-dim" />
            </span>
          )}
        </div>
      )}
      renderFloating={(props) => (
        <Menu {...props}>
          <LinkMenuItem to="/user/settings" onClick={() => setOpen(false)} className="row gap-2">
            <IconUser className="icon" />
            <T id="userSettings" />
          </LinkMenuItem>

          <ThemeMenuItem />

          <ButtonMenuItem onClick={() => logout.mutate()}>
            <IconLogOut className="icon" />
            <T id="logout" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}

function ThemeMenuItem() {
  const [open, setOpen] = useState(false);
  const themeMode = useThemeMode();
  const setThemeMode = useSetThemeMode();

  return (
    <>
      <ButtonMenuItem onClick={() => setOpen(!open)}>
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
