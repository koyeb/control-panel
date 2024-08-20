import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import IconChevronLeft from 'lucide-static/icons/chevron-left.svg?react';
import IconMenu from 'lucide-static/icons/menu.svg?react';
import IconPlus from 'lucide-static/icons/plus.svg?react';
import IconX from 'lucide-static/icons/x.svg?react';
import { Suspense, useEffect, useState } from 'react';

import { Button, useBreakpoint } from '@koyeb/design-system';
import { useOrganizationQuery, useOrganizationUnsafe, useUserQuery } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { getConfig } from 'src/application/config';
import { routes } from 'src/application/routes';
import { getAccessToken } from 'src/application/token';
import { DocumentTitle } from 'src/components/document-title';
import { Link, LinkButton } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import Logo from 'src/components/logo.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useLocation, usePathname, useSearchParams } from 'src/hooks/router';
import { useLocalStorage, useSessionStorage } from 'src/hooks/storage';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { AppHeader } from './app-header';
import { EstimatedCosts } from './estimated-costs';
import { GlobalAlert } from './global-alert';
import { HelpLinks } from './help-links';
import { Navigation } from './navigation';
import { OrganizationSwitcher } from './organization-switcher';
import { PlatformStatus } from './platform-status';
import { UserMenu } from './user-menu';

const T = Translate.prefix('layouts.main');

type LayoutProps = {
  children?: React.ReactNode;
};

export function MainLayout({ children }: LayoutProps) {
  const isDesktop = useBreakpoint('xl');
  const isTablet = useBreakpoint('sm') && !isDesktop;
  const isMobile = !isTablet && !isDesktop;

  return (
    <>
      <DocumentTitle />

      {isMobile && <SidebarMobile />}

      <PageContext>
        <Content>
          <AppHeader />
          <GlobalAlert />
          {children}
        </Content>
      </PageContext>

      {isDesktop && <SidebarDesktop />}
      {isTablet && <SidebarTablet />}
    </>
  );
}

function SidebarDesktop() {
  return (
    <aside className="fixed left-0 top-0 w-64">
      <SidebarContent />
    </aside>
  );
}

function SidebarTablet() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <aside
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={clsx('fixed left-0 top-0 w-16', !collapsed && 'w-64')}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

function SidebarMobile() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    function listener(event: MouseEvent) {
      const target = event.target;

      if (target instanceof HTMLElement) {
        if (target.closest('aside') === null) {
          setOpen(false);
        }
      }
    }

    document.addEventListener('click', listener);

    return () => {
      document.addEventListener('click', listener);
    };
  }, []);

  useEffect(() => {
    function listener(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', listener);

    return () => {
      document.addEventListener('keydown', listener);
    };
  }, []);

  return (
    <>
      <div className="row items-center justify-between gap-4 border-b p-3">
        <Button color="gray" variant="outline" size={1} className="!px-1" onClick={() => setOpen(true)}>
          <IconMenu className="size-4" />
        </Button>
      </div>

      <aside
        className={clsx(
          'fixed left-0 top-0 z-10 w-64 transition-transform',
          open && 'translate-x-0',
          !open && '-translate-x-64',
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}

function SidebarContent({ collapsed = false }: { collapsed?: boolean }) {
  const organization = useOrganizationUnsafe();
  const isDeactivated = inArray(organization?.status, ['deactivating', 'deactivated']);

  return (
    <div className="max-h-screen overflow-y-auto bg-neutral">
      <div className="col min-h-screen gap-6 border-r bg-muted/40 py-6">
        <Link
          href={isDeactivated ? routes.organizationSettings.index() : routes.home()}
          className="mx-2 px-3"
        >
          {collapsed && <Logo className="h-6" />}
          {!collapsed && <LogoKoyeb className="h-6" />}
        </Link>

        {collapsed && (
          <div className="mx-3 my-px px-2 py-1">
            <OrganizationAvatar className="size-6 rounded-full" />
          </div>
        )}

        {!collapsed && (
          <div className="col px-3">
            <OrganizationSwitcher />
          </div>
        )}

        <LinkButton
          size={2}
          href={routes.createService()}
          disabled={isDeactivated}
          className="mx-3 capitalize"
        >
          {collapsed && (
            <div>
              <IconPlus className="size-5" />
            </div>
          )}
          {!collapsed && <T id="createService" />}
        </LinkButton>

        <Navigation collapsed={collapsed} />

        {!collapsed && <EstimatedCosts />}

        <div className="col gap-2">
          <HelpLinks collapsed={collapsed} />
          <UserMenu collapsed={collapsed} />
        </div>

        <PlatformStatus collapsed={collapsed} />
      </div>
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();
  const isAuthenticated = userQuery.data !== undefined && organizationQuery.data !== undefined;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="sm:pl-16 xl:pl-64">
      <SessionTokenBanner />
      <main className="col relative mx-auto max-w-main gap-8 p-4">
        <Suspense>{children}</Suspense>
      </main>
    </div>
  );
}

function SessionTokenBanner() {
  const organization = useOrganizationUnsafe();

  const [sessionToken, , clearSessionToken] = useSessionStorage('session-token', {
    parse: String,
    stringify: String,
  });

  const mutation = useMutation({
    ...useApiMutationFn('logout', {}),
    onSuccess: clearSessionToken,
  });

  if (!sessionToken || !organization) {
    return null;
  }

  return (
    <div className="sticky inset-x-0 top-0 z-10 bg-orange py-1 text-center font-medium">
      <T id="sessionTokenWarning" values={{ organizationName: organization.name }} />
      <button type="button" className="absolute inset-y-0 right-0 px-4" onClick={() => mutation.mutate()}>
        <IconX className="size-5" />
      </button>
    </div>
  );
}

function PageContext({ children }: { children: React.ReactNode }) {
  const { data: user } = useUserQuery();
  const { pageContextBaseUrl } = getConfig();
  const pathname = usePathname();
  const search = useSearchParams();
  const token = getAccessToken();
  const theme = useThemeModeOrPreferred();
  const pageContextFlag = useFeatureFlag('page-context');
  const [expanded, setExpanded] = useLocalStorage<boolean>('page-context-expanded');

  if (!pageContextFlag || pageContextBaseUrl === undefined || !user?.flags.includes('ADMIN')) {
    return children;
  }

  search.set('theme', theme);

  if (token) {
    search.set('token', token);
  }

  return (
    <div className="row">
      <div className="relative min-w-0 flex-1">
        {children}
        <button onClick={() => setExpanded(!expanded)} className="absolute right-0 top-0 m-2 p-2">
          <IconChevronLeft className={clsx('size-6 text-dim', expanded && 'rotate-180')} />
        </button>
      </div>

      <iframe
        src={`${pageContextBaseUrl}/context${pathname}?${search.toString()}`}
        allow="clipboard-write"
        className="sticky right-0 top-0 h-screen border-l"
        width={expanded ? 500 : 0}
      />
    </div>
  );
}
