import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import IconChevronLeft from 'lucide-static/icons/chevron-left.svg?react';
import IconPlus from 'lucide-static/icons/plus.svg?react';
import IconX from 'lucide-static/icons/x.svg?react';
import { Suspense } from 'react';

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
import { usePathname, useSearchParams } from 'src/hooks/router';
import { useLocalStorage, useSessionStorage } from 'src/hooks/storage';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { Translate } from 'src/intl/translate';
import { inArray } from 'src/utils/arrays';

import { AppBreadcrumbs } from './app-breadcrumbs';
import { EstimatedCosts } from './estimated-costs';
import { HelpLinks } from './help-links';
import { Layout } from './layout';
import { Navigation } from './navigation';
import { OrganizationSwitcher } from './organization-switcher';
import { PlatformStatus } from './platform-status';
import { UserMenu } from './user-menu';

const T = Translate.prefix('layouts.main');

type LayoutProps = {
  children?: React.ReactNode;
};

export function MainLayout({ children }: LayoutProps) {
  return (
    <>
      <DocumentTitle />

      <Layout
        header={<AppBreadcrumbs />}
        menu={(collapsed) => <Menu collapsed={collapsed} />}
        main={<Main>{children}</Main>}
      />

      <PageContext />
    </>
  );
}

function Menu({ collapsed }: { collapsed: boolean }) {
  const organization = useOrganizationUnsafe();
  const isDeactivated = inArray(organization?.status, ['deactivating', 'deactivated']);

  return (
    <div className="col min-h-full gap-4 py-4 sm:gap-6 sm:py-6">
      <Link href={isDeactivated ? routes.organizationSettings.index() : routes.home()} className="mx-2 px-3">
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

      <LinkButton size={2} href={routes.createService()} disabled={isDeactivated} className="mx-3 capitalize">
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
  );
}

function Main({ children }: { children: React.ReactNode }) {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();
  const isAuthenticated = userQuery.data !== undefined && organizationQuery.data !== undefined;

  const pageContext = usePageContext();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main
      // eslint-disable-next-line tailwindcss/no-arbitrary-value
      className={clsx(
        'overflow-hidden p-2 sm:p-4',
        pageContext.enabled && {
          'pr-4': !pageContext.expanded,
          'pr-[32rem]': pageContext.expanded,
        },
      )}
    >
      <SessionTokenBanner />
      <Suspense>{children}</Suspense>
    </main>
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

function PageContext() {
  const { pageContextBaseUrl } = getConfig();
  const { enabled, expanded, setExpanded } = usePageContext();

  const pathname = usePathname();
  const search = useSearchParams();
  const token = getAccessToken();
  const theme = useThemeModeOrPreferred();

  if (!enabled) {
    return null;
  }

  search.set('theme', theme);

  if (token) {
    search.set('token', token);
  }

  return (
    // eslint-disable-next-line tailwindcss/no-arbitrary-value
    <div className={clsx('fixed inset-y-0 right-0 w-0', expanded && 'w-[32rem]')}>
      <div className="col absolute inset-y-0 right-full justify-center">
        <button onClick={() => setExpanded(!expanded)}>
          <IconChevronLeft className={clsx('size-6 text-dim', expanded && 'rotate-180')} />
        </button>
      </div>

      <iframe
        src={`${pageContextBaseUrl}/context${pathname}?${search.toString()}`}
        allow="clipboard-write"
        className="size-full border-l"
      />
    </div>
  );
}

function usePageContext() {
  const { data: user } = useUserQuery();
  const { pageContextBaseUrl } = getConfig();
  const pageContextFlag = useFeatureFlag('page-context');

  const enabled = pageContextBaseUrl !== undefined && user?.flags.includes('ADMIN') && pageContextFlag;

  const [expanded, setExpanded] = useLocalStorage<boolean>('page-context-expanded');

  return {
    enabled,
    expanded,
    setExpanded,
  };
}
