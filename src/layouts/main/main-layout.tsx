import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Suspense, useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { useOrganizationUnsafe, useUserQuery, useUserUnsafe } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { getConfig } from 'src/application/config';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { routes } from 'src/application/routes';
import { getToken } from 'src/application/token';
import { DocumentTitle } from 'src/components/document-title';
import { IconChevronLeft, IconPlus, IconX } from 'src/components/icons';
import { Link, LinkButton } from 'src/components/link';
import LogoKoyeb from 'src/components/logo-koyeb.svg?react';
import Logo from 'src/components/logo.svg?react';
import { OrganizationAvatar } from 'src/components/organization-avatar';
import { useLocation } from 'src/hooks/router';
import { useLocalStorage, useSessionStorage } from 'src/hooks/storage';
import { useThemeModeOrPreferred } from 'src/hooks/theme';
import { Translate } from 'src/intl/translate';
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

const T = Translate.prefix('layouts.main');

type LayoutProps = {
  children?: React.ReactNode;
};

export function MainLayout({ children }: LayoutProps) {
  const pageContext = usePageContext();

  return (
    <>
      <DocumentTitle />

      <Layout
        banner={<SessionTokenBanner />}
        header={<AppBreadcrumbs />}
        menu={(collapsed) => <Menu collapsed={collapsed} />}
        main={<Main>{children}</Main>}
        context={pageContext.enabled ? <PageContext {...pageContext} /> : undefined}
        contextExpanded={pageContext.expanded}
      />
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
    <div className="sticky inset-x-0 top-0 z-30 bg-orange py-1 text-center font-medium">
      <T id="sessionTokenWarning" values={{ organizationName: organization.name }} />
      <button type="button" className="absolute inset-y-0 right-0 px-4" onClick={() => mutation.mutate()}>
        <IconX className="size-5" />
      </button>
    </div>
  );
}

type PageContextProps = {
  enabled: boolean;
  expanded?: boolean;
  setExpanded: (expanded: boolean) => void;
};

function PageContext({ enabled, expanded, setExpanded }: PageContextProps) {
  const { pageContextBaseUrl } = getConfig();

  const location = useLocation();
  const token = getToken();
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

  if (!enabled) {
    return null;
  }

  return (
    <div className={clsx('fixed inset-y-0 right-0 w-0 bg-muted', expanded && 'w-full max-w-lg')}>
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
    </div>
  );
}

const isReadyEvent = createValidationGuard(z.object({ ready: z.literal(true) }));

function usePageContext(): PageContextProps {
  const { data: user } = useUserQuery();
  const { pageContextBaseUrl } = getConfig();

  const enabled = Boolean(pageContextBaseUrl !== undefined && user?.flags.includes('ADMIN'));

  const [expanded, setExpanded] = useLocalStorage<boolean>('page-context-expanded');

  return {
    enabled,
    expanded,
    setExpanded,
  };
}
