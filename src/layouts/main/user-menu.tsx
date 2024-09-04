import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

import { ButtonMenuItem, Collapse, Floating, Menu, MenuItem, useBreakpoint } from '@koyeb/design-system';
import { useUserUnsafe } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
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
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.userMenu');

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { clearToken } = useAccessToken();
  const user = useUserUnsafe();
  const navigate = useNavigate();

  const isMobile = !useBreakpoint('sm');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [collapsed]);

  const { mutate: logout } = useMutation({
    ...useApiMutationFn('logout', {}),
    onSuccess() {
      clearToken();
      navigate(routes.signIn());
    },
  });

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      placement={isMobile ? 'bottom' : 'left'}
      renderReference={(ref, props) => (
        <button
          ref={ref}
          type="button"
          className="row mx-3 items-center gap-2 p-2 text-start text-dim hover:text-default"
          onClick={() => setOpen(true)}
          {...props}
        >
          <UserAvatar user={user} />
          {!collapsed && <span className="flex-1 truncate font-medium">{user?.name}</span>}
        </button>
      )}
      renderFloating={(ref, props) => (
        <Menu ref={ref} {...props}>
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

          <ButtonMenuItem
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
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
        <IconChevronRight className={clsx('icon ms-auto', open && 'rotate-90')} />
      </ButtonMenuItem>

      <Collapse isExpanded={open}>
        <div className="col items-stretch border-y">
          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.light)}>
            <IconSunDim className="icon" />
            <T id="light" />
            {themeMode === ThemeMode.light && <IconCheck className="icon ms-auto" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.dark)}>
            <IconMoon className="icon" />
            <T id="dark" />
            {themeMode === ThemeMode.dark && <IconCheck className="icon ms-auto" />}
          </ButtonMenuItem>

          <ButtonMenuItem className="pl-4" onClick={() => setThemeMode(ThemeMode.system)}>
            <IconLaptop className="icon" />
            <T id="system" />
            {themeMode === ThemeMode.system && <IconCheck className="icon ms-auto" />}
          </ButtonMenuItem>
        </div>
      </Collapse>
    </>
  );
}
