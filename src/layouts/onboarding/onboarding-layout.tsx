import { apiQuery } from 'src/api/api';
import { ButtonMenuItem, Floating, Menu } from '@koyeb/design-system';
import { useQuery } from '@tanstack/react-query';

import { useState } from 'react';
import { useLogoutMutation, useUser } from 'src/api/hooks/session';
import { LinkMenuItem } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { UserAvatar } from 'src/components/user-avatar';
import { useSearchParams } from 'src/hooks/router';
import { useForceThemeMode } from 'src/hooks/theme';
import { IconChevronRight, IconLogOut, IconUser } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { OrganizationSwitcher } from '../organization-switcher';
import { SecondaryLayoutHeader } from '../secondary/secondary-layout-header';
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
    <div className="col min-h-screen bg-muted">
      <div className="lg:hidden">
        <SecondaryLayoutHeader className="from-muted!" />
      </div>

      <div className="fixed hidden h-full w-sm py-3 pl-3 lg:block">
        <Slides sentence={sentence} />
      </div>

      <div className="col flex-1 justify-center px-4 py-18 lg:ml-[24rem] lg:py-4">
        <main className="mx-auto w-full max-w-xl">{children}</main>
      </div>
    </div>
  );
}

function Slides({ sentence }: { sentence: React.ReactNode }) {
  const { data: hasMultipleOrganizations } = useQuery({
    ...apiQuery('get /v1/account/organizations', { query: {} }),
    select: ({ organizations }) => organizations!.length > 1,
  });

  return (
    <aside className="dark col h-full gap-8 rounded-2xl bg-neutral/95 px-12 py-16">
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
  const logout = useLogoutMutation('/auth/signin');
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
          <LinkMenuItem
            to="/"
            search={{ settings: 'true' }}
            onClick={() => setOpen(false)}
            className="row gap-2"
          >
            <IconUser className="icon" />
            <T id="userSettings" />
          </LinkMenuItem>

          <ButtonMenuItem onClick={() => logout.mutate()}>
            <IconLogOut className="icon" />
            <T id="logout" />
          </ButtonMenuItem>
        </Menu>
      )}
    />
  );
}
