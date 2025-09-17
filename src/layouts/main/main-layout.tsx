import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Suspense, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { useDatacenters } from 'src/api/hooks/catalog';
import {
  useLogoutMutation,
  useOrganization,
  useOrganizationUnsafe,
  useUserUnsafe,
} from 'src/api/hooks/session';
import { useEnsureApiQueryData } from 'src/api/use-api';
import { container } from 'src/application/container';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { getUrlLatency } from 'src/application/url-latency';
import { DocumentTitle } from 'src/components/document-title';
import { Link, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import Logo from 'src/components/logo.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { useLocation } from 'src/hooks/router';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { IconChevronLeft, IconPlus, IconX } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CommandPaletteProvider } from 'src/modules/command-palette';
import { TrialBanner } from 'src/modules/trial/trial-banner';
import { TrialWelcomeDialog } from 'src/modules/trial/trial-welcome-dialog';
import { useTrial } from 'src/modules/trial/use-trial';
import { TOKENS } from 'src/tokens';
import { inArray } from 'src/utils/arrays';
import { getConfig } from 'src/utils/config';

import { OrganizationSwitcher } from '../organization-switcher';

import { AppBreadcrumbs } from './app-breadcrumbs';
import { FeatureFlagsDialog } from './feature-flags-dialog';
import { GlobalAlert } from './global-alert';
import { HelpLinks } from './help-links';
import { Layout } from './layout';
import { Navigation } from './navigation';
import { OrganizationPlan } from './organization-plan';
import { PlatformStatus } from './platform-status';
import { UserMenu } from './user-menu';

const T = createTranslate('layouts.main');

type LayoutProps = {
  children?: React.ReactNode;
};

export function MainLayout({ children }: LayoutProps) {
  const pageContext = usePageContext();
  const banner = useBanner();

  if (!useOrganizationUnsafe()) {
    return null;
  }

  return (
    <CommandPaletteProvider>
      <DocumentTitle />

      <FeatureFlagsDialog />
      <TrialWelcomeDialog />

      <Layout
        banner={banner ? { session: <SessionTokenBanner />, trial: <TrialBanner /> }[banner] : null}
        header={<AppBreadcrumbs />}
        menu={<Menu />}
        menuCollapsed={<Menu collapsed />}
        main={<Main>{children}</Main>}
        context={pageContext.enabled ? <PageContext {...pageContext} /> : null}
        contextExpanded={pageContext.expanded}
      />
    </CommandPaletteProvider>
  );
}

function Menu({ collapsed = false }: { collapsed?: boolean }) {
  const organization = useOrganization();
  const isDeactivated = inArray(organization.status, ['DEACTIVATING', 'DEACTIVATED']);

  return (
    <div className="col min-h-full gap-4 py-4 sm:gap-6 sm:py-6">
      <Link to={isDeactivated ? '/settings' : '/'} className="mx-2 px-3">
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
          <OrganizationSwitcher showCreateOrganization />
        </div>
      )}

      <LinkButton size={2} to="/services/new" disabled={isDeactivated} className="mx-3 capitalize">
        {collapsed && (
          <div>
            <IconPlus className="size-5" />
          </div>
        )}
        {!collapsed && <T id="createService" />}
      </LinkButton>

      <Navigation collapsed={collapsed} />

      <div className="col gap-4">
        {!collapsed && (
          <div role="menu" className="mx-4 divide-y rounded-md border bg-neutral">
            <UserMenu collapsed={collapsed} />
            <OrganizationPlan />
          </div>
        )}

        <div className="col gap-2">
          <HelpLinks collapsed={collapsed} />
          <PlatformStatus collapsed={collapsed} />
        </div>
      </div>
    </div>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  return (
    <main className="px-2 py-4 sm:px-4">
      <Suspense fallback={<Loading />}>
        <PreloadResources />
        <GlobalAlert />
        {children}
      </Suspense>
    </main>
  );
}

function PreloadResources() {
  const organization = useOrganization();
  const queryClient = useQueryClient();
  const ensureApiQueryData = useEnsureApiQueryData();

  useEffect(() => {
    void ensureApiQueryData('listCatalogDatacenters', {});
    void ensureApiQueryData('listCatalogRegions', { query: { limit: '100' } });
    void ensureApiQueryData('listCatalogInstances', { query: { limit: '100' } });
    void ensureApiQueryData('organizationSummary', { path: { organization_id: organization.id } });
    void ensureApiQueryData('organizationQuotas', { path: { organization_id: organization.id } });
  }, [ensureApiQueryData, organization]);

  const datacenters = useDatacenters().filter(({ id }) => !id.includes('aws'));

  useEffect(() => {
    for (const datacenter of datacenters) {
      if (datacenter.id.includes('aws')) {
        continue;
      }

      const url = `https://${datacenter.domain}/health`;

      void queryClient.ensureQueryData({
        queryKey: ['datacenterLatency', url],
        queryFn: () => getUrlLatency(url),
      });
    }
  }, [datacenters, queryClient]);

  return null;
}
function useBanner(): 'session' | 'trial' | void {
  const auth = container.resolve(TOKENS.authentication);
  const trial = useTrial();

  if (auth.session) {
    return 'session';
  }

  if (trial) {
    return 'trial';
  }
}

function SessionTokenBanner() {
  const organization = useOrganization();
  const logout = useLogoutMutation('/', true);

  return (
    <div className="bg-orange px-4 py-1.5 text-center font-medium md:h-full md:whitespace-nowrap">
      <T id="sessionTokenWarning" values={{ organizationName: organization.name }} />
      <button type="button" className="absolute inset-y-0 right-0 px-4" onClick={() => logout.mutate()}>
        <IconX className="size-5" />
      </button>
    </div>
  );
}

type PageContextProps = {
  expanded?: boolean;
  setExpanded: (expanded: boolean) => void;
};

function PageContext({ expanded, setExpanded }: PageContextProps) {
  const pageContextBaseUrl = getConfig('pageContextBaseUrl');
  const auth = container.resolve(TOKENS.authentication);

  const location = useLocation();
  const theme = useThemeModeOrPreferred();

  const iFrameRef = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(0);

  useEffect(() => {
    function listener(event: MessageEvent<unknown>) {
      if (event.origin === pageContextBaseUrl && isReadyEvent(event.data)) {
        setReady((ready) => ready + 1);
      }
    }

    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [pageContextBaseUrl, iFrameRef]);

  useEffect(() => {
    if (pageContextBaseUrl !== undefined && ready) {
      iFrameRef.current?.contentWindow?.postMessage({ token: auth.token, location }, pageContextBaseUrl);
    }
  }, [pageContextBaseUrl, iFrameRef, ready, location, auth]);

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className={clsx(
          'absolute right-full hidden h-full justify-center bg-muted/50 transition-opacity sm:col',
          !expanded && 'opacity-0 hover:opacity-100',
        )}
      >
        <IconChevronLeft className={clsx('size-6 text-dim', expanded && '-scale-x-100')} />
      </button>

      <iframe
        ref={iFrameRef}
        src={`${pageContextBaseUrl}/context?theme=${theme}`}
        allow="clipboard-write"
        className="size-full border-l"
      />
    </>
  );
}

const isReadyEvent = createValidationGuard(z.object({ ready: z.literal(true) }));

const storage = container.resolve(TOKENS.storage);
const pageContextExpanded = storage.value<boolean>('page-context-expanded');

function usePageContext() {
  const user = useUserUnsafe();
  const pageContextBaseUrl = getConfig('pageContextBaseUrl');

  const enabled = Boolean(pageContextBaseUrl !== undefined && user?.flags.includes('ADMIN'));
  const [expanded, setExpanded] = useState(pageContextExpanded.read() ?? false);

  return {
    enabled,
    expanded: enabled && expanded,
    setExpanded: (expanded: boolean) => {
      setExpanded(expanded);
      pageContextExpanded.write(expanded);
    },
  };
}
