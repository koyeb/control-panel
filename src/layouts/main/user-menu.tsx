import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import IconCheck from 'lucide-static/icons/check.svg?react';
import IconChevronRight from 'lucide-static/icons/chevron-right.svg?react';
import IconLaptop from 'lucide-static/icons/laptop.svg?react';
import IconLogOut from 'lucide-static/icons/log-out.svg?react';
import IconMoon from 'lucide-static/icons/moon.svg?react';
import IconSunDim from 'lucide-static/icons/sun-dim.svg?react';
import IconUser from 'lucide-static/icons/user.svg?react';
import { useEffect, useState } from 'react';

import { Collapse, Floating, ButtonMenuItem, Menu, MenuItem, useBreakpoint } from '@koyeb/design-system';
import { useUserQuery } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { useAccessToken } from 'src/application/token';
import { Link } from 'src/components/link';
import { useNavigate } from 'src/hooks/router';
import { ThemeMode, useThemeMode } from 'src/hooks/theme';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.userMenu');

export function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { clearToken } = useAccessToken();
  const { data: user } = useUserQuery();
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

type UserAvatarProps = {
  user?: { avatarUrl: string };
};

function UserAvatar({ user }: UserAvatarProps) {
  const { avatarUrl = 'https://gravatar.com/avatar' } = user ?? {};
  const searchParams = new URLSearchParams({ default: 'retro', size: '48' });

  return <img className="size-6 rounded-full" src={`${avatarUrl}?${searchParams.toString()}`} />;
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
