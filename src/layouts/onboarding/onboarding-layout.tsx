import { useQuery } from '@tanstack/react-query';

import { apiQuery, useUser } from 'src/api';
import { ButtonMenuItem, DropdownMenu, LinkMenuItem } from 'src/components/dropdown-menu';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import { UserAvatar } from 'src/components/user-avatar';
import { useNavigate, useSearchParams } from 'src/hooks/router';
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

      <div className="col flex-1 justify-center px-4 py-18 lg:ml-96 lg:py-4">
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

      {hasMultipleOrganizations && <OrganizationSwitcher dark />}

      <div className="col flex-1 justify-center gap-6">
        <div className="text-base leading-relaxed text-dim">{sentence}</div>
      </div>

      <UserMenu />
    </aside>
  );
}

function UserMenu() {
  const user = useUser();
  const navigate = useNavigate();

  return (
    <DropdownMenu
      openOnHover
      dropdown={{
        floating: { placement: 'right-end' },
      }}
      reference={(props) => (
        <button
          type="button"
          className="row items-center gap-2 rounded-md p-2 text-start transition-colors hover:bg-muted/50"
          {...props}
        >
          <UserAvatar user={user} />

          <span className="flex-1 truncate font-medium">{user?.name}</span>

          <span>
            <IconChevronRight className="size-4 text-dim" />
          </span>
        </button>
      )}
    >
      <LinkMenuItem to="/" search={{ settings: 'true' }} className="row gap-2">
        <IconUser className="icon" />
        <T id="userSettings" />
      </LinkMenuItem>

      <ButtonMenuItem onClick={() => void navigate({ to: '/auth/signout' })}>
        <IconLogOut className="icon" />
        <T id="logout" />
      </ButtonMenuItem>
    </DropdownMenu>
  );
}
