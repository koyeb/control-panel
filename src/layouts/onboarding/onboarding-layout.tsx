import { ButtonMenuItem, Floating, Menu, MenuItem } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useLogoutMutation, useUser } from 'src/api/hooks/session';
import { useApiQueryFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { IconChevronRight, IconLogOut, IconUser } from 'src/components/icons';
import { Link } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { UserAvatar } from 'src/components/user-avatar';
import { useSearchParams } from 'src/hooks/router';
import { useForceThemeMode } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';

import { OrganizationSwitcher } from '../organization-switcher';
import { SecondarySettings } from '../secondary/settings';

const T = createTranslate('layouts.onboarding');

type OnboardingLayoutProps = {
  sentence: React.ReactNode;
  children: React.ReactNode;
};

export function OnboardingLayout({ sentence, children }: OnboardingLayoutProps) {
  const params = useSearchParams();

  useForceThemeMode('light');

  if (params.has('settings')) {
    return <SecondarySettings />;
  }

  return (
    <div className="row h-screen overflow-auto bg-muted p-3">
      <Slides sentence={sentence} />
      <main className="mx-auto col max-w-xl flex-1 py-8">{children}</main>
    </div>
  );
}

function Slides({ sentence }: { sentence: React.ReactNode }) {
  const { data: hasMultipleOrganizations } = useQuery({
    ...useApiQueryFn('listUserOrganizations', { query: {} }),
    select: ({ organizations }) => organizations!.length > 1,
  });

  return (
    <aside className="dark hidden w-full max-w-sm flex-col gap-8 rounded-2xl bg-neutral/95 px-12 py-16 lg:flex">
      <LogoKoyeb className="h-8 self-start" />

      {hasMultipleOrganizations && <OrganizationSwitcher />}

      <div className="col flex-1 justify-center gap-6">
        <div className="text-base leading-relaxed text-dim">{sentence}</div>
      </div>

      <UserMenu />
    </aside>
  );
}

function UserMenu() {
  const user = useUser();
  const logout = useLogoutMutation(routes.signIn());
  const [open, setOpen] = useState(false);

  return (
    <Floating
      open={open}
      setOpen={setOpen}
      hover
      placement="left-end"
      offset={8}
      renderReference={(props) => (
        <div className="row items-center gap-2 py-2 transition-colors hover:bg-muted/50" {...props}>
          <UserAvatar user={user} />

          <span className="flex-1 truncate font-medium">{user.name}</span>

          <span>
            <IconChevronRight className="size-4 text-dim" />
          </span>
        </div>
      )}
      renderFloating={(props) => (
        <Menu className="min-w-32" {...props}>
          <MenuItem element={Link} to="?settings" onClick={() => setOpen(false)} className="row gap-2">
            <IconUser className="icon" />
            <T id="userSettings" />
          </MenuItem>

          <ButtonMenuItem onClick={() => logout.mutate()}>
            <IconLogOut className="icon" />
            <T id="logout" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}
