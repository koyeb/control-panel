import { ButtonMenuItem, Collapse, Floating, Menu, MenuItem, useBreakpoint } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { useUser } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { useResetIdentifyUser } from 'src/application/posthog';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import {
  IconCheck,
  IconChevronRight,
  IconLaptop,
  IconLogOut,
  IconMoon,
  IconSunDim,
  IconUser,
} from 'src/components/icons';
import { Link } from 'src/components/link';
import { UserAvatar } from 'src/components/user-avatar';
import { useNavigate } from 'src/hooks/router';
import { ThemeMode, useThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.userMenu');

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { clearToken } = useToken();
  const user = useUser();
  const resetIdentify = useResetIdentifyUser();
  const navigate = useNavigate();

  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);

  const { mutate: logout } = useMutation({
    ...useApiMutationFn('logout', {}),
    onSuccess() {
      clearToken();
      resetIdentify();
      navigate(routes.signIn());
    },
  });

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
          <MenuItem
            element={Link}
            href={routes.userSettings.index()}
            onClick={() => setOpen(false)}
            className="row gap-2"
          >
            <IconUser className="icon" />
            <T id="userSettings" />
          </MenuItem>

          <ThemeMenuItem />

          <ButtonMenuItem onClick={() => logout()}>
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
  const [themeMode, setThemeMode] = useThemeMode();

  return (
    <>
      <ButtonMenuItem onClick={() => setOpen(!open)}>
        <IconSunDim className="icon" />
        <T id="theme" />
        <IconChevronRight className={clsx('ms-auto icon', open && 'rotate-90')} />
      </ButtonMenuItem>

      <Collapse open={open}>
        <div className="col items-stretch border-y">
          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.light)}>
            <IconSunDim className="icon" />
            <T id="light" />
            {themeMode === ThemeMode.light && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.dark)}>
            <IconMoon className="icon" />
            <T id="dark" />
            {themeMode === ThemeMode.dark && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.system)}>
            <IconLaptop className="icon" />
            <T id="system" />
            {themeMode === ThemeMode.system && <IconCheck className="ms-auto icon" />}
          </ButtonMenuItem>
        </div>
      </Collapse>
    </>
  );
}
