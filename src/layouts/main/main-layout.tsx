import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Suspense, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { useOrganization, useOrganizationUnsafe, useUserQuery, useUserUnsafe } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { getConfig } from 'src/application/config';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { routes } from 'src/application/routes';
import { useToken } from 'src/application/token';
import { DocumentTitle } from 'src/components/document-title';
import { IconChevronLeft, IconPlus, IconX } from 'src/components/icons';
import { Link, LinkButton } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import Logo from 'src/components/logo.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useLocation, useNavigate } from 'src/hooks/router';
import { useLocalStorage } from 'src/hooks/storage';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { createTranslate } from 'src/intl/translate';
import { CommandPalette } from 'src/modules/command-palette/command-palette';
import { CreateServiceDialog } from 'src/modules/create-service-dialog/create-service-dialog';
import { TrialBanner } from 'src/modules/trial/trial-banner';
import { TrialWelcomeDialog } from 'src/modules/trial/trial-welcome-dialog';
import { inArray } from 'src/utils/arrays';

import { AppBreadcrumbs } from './app-breadcrumbs';
import { EstimatedCosts } from './estimated-costs';
import { GlobalAlert } from './global-alert';
import { HelpLinks } from './help-links';
import { Layout } from './layout';
import { Navigation } from './navigation';
import { OrganizationSwitcher } from './organization-switcher';
import { PlatformStatus } from './platform-status';
import { UserMenu } from './user-menu';

const T = createTranslate('layouts.main');

type LayoutProps = {
  children?: React.ReactNode;
};

export function MainLayout({ children }: LayoutProps) {
  const pageContext = usePageContext();
  const banner = useBanner();

  return (
    <CommandPalette>
      <DocumentTitle />
      <CreateServiceDialog />

      <FeatureFlag feature="trial">
        <TrialWelcomeDialog />
      </FeatureFlag>

      <Layout
        banner={banner ? { session: <SessionTokenBanner />, trial: <TrialBanner /> }[banner] : null}
        hasBanner={banner !== undefined}
        header={<AppBreadcrumbs />}
        menu={<Menu />}
        menuCollapsed={<Menu collapsed />}
        main={<Main>{children}</Main>}
        context={pageContext.enabled ? <PageContext {...pageContext} /> : null}
        contextExpanded={pageContext.expanded}
      />
    </CommandPalette>
  );
}

function Menu({ collapsed = false }: { collapsed?: boolean }) {
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

      <UserMenu collapsed={collapsed} />

      <div className="col gap-2">
        <HelpLinks collapsed={collapsed} />
        <PlatformStatus collapsed={collapsed} />
      </div>
    </div>
  );
}

function Main({ children }: { children: React.ReactNode }) {
  const user = useUserUnsafe();
  const organization = useOrganizationUnsafe();
  const isAuthenticated = user !== undefined && organization !== undefined;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="overflow-x-auto px-2 py-4 sm:px-4">
      <Suspense>
        <GlobalAlert />
        {children}
      </Suspense>
    </main>
  );
}

function useBanner(): 'session' | 'trial' | void {
  const { session } = useToken();
  const organization = useOrganizationUnsafe();

  if (organization === undefined) {
    return;
  }

  if (session) {
    return 'session';
  }

  if (organization.trial) {
    return 'trial';
  }
}

function SessionTokenBanner() {
  const organization = useOrganization();
  const { clearToken } = useToken();
  const navigate = useNavigate();

  const mutation = useMutation({
    ...useApiMutationFn('logout', {}),
    onMutate: clearToken,
    onSuccess: () => navigate(routes.home()),
  });

  return (
    <div className="bg-orange px-4 py-1.5 text-center font-medium md:h-full md:whitespace-nowrap">
      <T id="sessionTokenWarning" values={{ organizationName: organization.name }} />
      <button type="button" className="absolute inset-y-0 right-0 px-4" onClick={() => mutation.mutate()}>
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
  const { pageContextBaseUrl } = getConfig();

  const { token } = useToken();
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
      iFrameRef.current?.contentWindow?.postMessage({ token, location }, pageContextBaseUrl);
    }
  }, [pageContextBaseUrl, iFrameRef, ready, token, location]);

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className="col absolute right-full h-full justify-center bg-muted/50 opacity-0 transition-opacity hover:opacity-100"
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

function usePageContext() {
  const { data: user } = useUserQuery();
  const { pageContextBaseUrl } = getConfig();

  const enabled = Boolean(pageContextBaseUrl !== undefined && user?.flags.includes('ADMIN'));
  const [expanded = false, setExpanded] = useLocalStorage<boolean>('page-context-expanded');

  return {
    enabled,
    expanded: enabled && expanded,
    setExpanded,
  };
}
