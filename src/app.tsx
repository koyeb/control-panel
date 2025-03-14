import { useQueries } from '@tanstack/react-query';
// eslint-disable-next-line no-restricted-imports
import { Redirect, Route, Switch } from 'wouter';

import { isAccountLockedError } from './api/api-errors';
import { useOrganizationQuery, useUserQuery } from './api/hooks/session';
import { useApiQueryFn } from './api/use-api';
import { useOnboardingStep } from './application/onboarding';
import { routes } from './application/routes';
import { useRefreshToken } from './application/token';
import { AccountLocked } from './components/account-locked';
import { LinkButton } from './components/link';
import { Loading } from './components/loading';
import { Translate } from './intl/translate';
import { MainLayout } from './layouts/main/main-layout';
import { ConfirmDeactivateOrganization } from './modules/account/confirm-deactivate-organization';
import { TrialEnded } from './modules/trial/trial-ended/trial-ended';
import { useTrial } from './modules/trial/use-trial';
import { AccountPages } from './pages/account/account.pages';
import { ActivityPage } from './pages/activity/activity.page';
import { AuthenticationPages } from './pages/authentication/authentication.pages';
import { CreateDatabasePage } from './pages/databases/create-database.page';
import { DatabaseServicePages } from './pages/databases/database/database.pages';
import { DomainsPage } from './pages/domains/domains.page';
import { ErrorTestPage } from './pages/error-test.page';
import { HomePage } from './pages/home/home.page';
import { ServicesPage } from './pages/home/services.page';
import { OnboardingPage } from './pages/onboarding/onboarding.page';
import { SecretsPage } from './pages/secrets/secrets.page';
import { ServiceConsolePage } from './pages/service/console/service-console.page';
import { CreateServicePage } from './pages/service/create-service.page';
import { DeployPage } from './pages/service/deploy/deploy.page';
import { ServiceMetricsPage } from './pages/service/metrics/service-metrics.page';
import { ServiceOverviewPage } from './pages/service/overview/service-overview.page';
import { ServiceLayout } from './pages/service/service.layout';
import { ServiceSettingsPage } from './pages/service/settings/service-settings.page';
import { OrganizationSettingsPages } from './pages/settings/organization/organization-settings.pages';
import { UserSettingsPages } from './pages/settings/user/user-settings.pages';
import { TeamPage } from './pages/team/team.page';
import { VolumeSnapshotsPage } from './pages/volumes/volume-snapshots/volume-snapshots.page';
import { VolumesLayout } from './pages/volumes/volumes-layout';
import { VolumesListPage } from './pages/volumes/volumes-list/volumes-list.page';

export function App() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();
  const trial = useTrial();

  useRefreshToken();

  if (
    isAccountLockedError(userQuery.error) ||
    isAccountLockedError(organizationQuery.error) ||
    organizationQuery.data?.statusMessage === 'verification_failed'
  ) {
    return <AccountLocked />;
  }

  if (trial?.ended) {
    return <TrialEnded />;
  }

  return (
    <Switch>
      <Route path="/auth/*?" component={AuthenticationPages} />
      <Route path="/account/*" component={AccountPages} />
      <Route component={AuthenticatedRoutes} />
    </Switch>
  );
}

function AuthenticatedRoutes() {
  const sessionQueries = useSessionQueries();
  const userQueries = useUserQueries(sessionQueries.userId);
  const organizationQueries = useOrganizationQueries(sessionQueries.organizationId);
  const catalogQueries = useCatalogQueries();

  const allQueries = [sessionQueries, catalogQueries, organizationQueries, userQueries];

  const userQuery = useUserQuery();
  const onboardingStep = useOnboardingStep();

  if (allQueries.some((query) => query.pending) || !userQuery.isSuccess) {
    return (
      <Loading>
        <MainLayout />
      </Loading>
    );
  }

  if (onboardingStep !== null) {
    return (
      <Switch>
        <Route
          path="/organization/deactivate/confirm/:confirmationId"
          component={ConfirmDeactivateOrganization}
        />
        <Route>
          <OnboardingPage step={onboardingStep} />
        </Route>
      </Switch>
    );
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={HomePage} />

        <Route path="/services" component={ServicesPage} />

        <Route path="/volumes/*?">
          <VolumesLayout>
            <Route path="/volumes" component={VolumesListPage} />
            <Route path="/volumes/snapshots" component={VolumeSnapshotsPage} />
          </VolumesLayout>
        </Route>

        <Route path="/domains" component={DomainsPage} />
        <Route path="/secrets" component={SecretsPage} />
        <Route path="/activity" component={ActivityPage} />
        <Route path="/team" component={TeamPage} />

        <Route path="/database-services/new" component={CreateDatabasePage} />
        <Route path="/database-services/:databaseServiceId/*?" component={DatabaseServicePages} />

        <Route path="/deploy">
          <Redirect replace to={`/services/deploy${window.location.search}`} />
        </Route>

        <Route path="/services/deploy" component={DeployPage} />
        <Route path="/services/new" component={CreateServicePage} />

        <Route path="/services/:serviceId/*?">
          <ServiceLayout>
            <Route path="/services/:serviceId" component={ServiceOverviewPage} />
            <Route path="/services/:serviceId/metrics" component={ServiceMetricsPage} />
            <Route path="/services/:serviceId/console" component={ServiceConsolePage} />
            <Route path="/services/:serviceId/settings" component={ServiceSettingsPage} />
          </ServiceLayout>
        </Route>

        <Route path="/settings/*?" component={OrganizationSettingsPages} />
        <Route path="/user/settings/*?" component={UserSettingsPages} />

        <Route
          path="/organization/deactivate/confirm/:confirmationId"
          component={ConfirmDeactivateOrganization}
        />

        <Route path="__error" component={ErrorTestPage} />

        <Route>
          <PageNotFound />
        </Route>
      </Switch>
    </MainLayout>
  );
}

function PageNotFound() {
  return (
    <div className="col items-center gap-4 py-8">
      <div className="typo-heading">
        <Translate id="pages.notFound.title" />
      </div>

      <div>
        <Translate id="pages.notFound.line1" />
      </div>

      <LinkButton href={routes.home()} className="mt-4">
        <Translate id="pages.notFound.back" />
      </LinkButton>
    </div>
  );
}

const disableRefetch = {
  refetchInterval: false,
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
} as const;

function useSessionQueries() {
  return useQueries({
    queries: [useApiQueryFn('getCurrentUser'), useApiQueryFn('getCurrentOrganization')],
    combine(queries) {
      const [{ data: user }, { data: organization }] = queries;

      return {
        pending: queries.some((query) => query.isPending),
        userId: user?.user?.id,
        organizationId: organization?.organization?.id,
      };
    },
  });
}

function useCatalogQueries() {
  return useQueries({
    queries: [
      useApiQueryFn('listCatalogDatacenters'),
      useApiQueryFn('listCatalogRegions', { query: { limit: '100' } }),
      useApiQueryFn('listCatalogInstances', { query: { limit: '100' } }),
    ].map((query) => ({
      ...disableRefetch,
      ...query,
    })),
    combine(queries) {
      return { pending: queries.some((query) => query.isPending) };
    },
  });
}

function useOrganizationQueries(organizationId: string | undefined) {
  return useQueries({
    queries: [
      useApiQueryFn('organizationQuotas', { path: { organization_id: organizationId! } }),
      useApiQueryFn('organizationSummary', { path: { organization_id: organizationId! } }),
    ].map((query) => ({
      enabled: organizationId !== undefined,
      ...disableRefetch,
      ...query,
    })),
    combine(queries) {
      return { pending: queries.some((query) => query.isPending) };
    },
  });
}

function useUserQueries(userId: string | undefined) {
  return useQueries({
    queries: [
      //
      useApiQueryFn('listOrganizationMembers', { query: { user_id: userId } }),
    ].map((query) => ({
      enabled: userId !== undefined,
      ...disableRefetch,
      ...query,
    })),
    combine(queries) {
      return { pending: queries.some((query) => query.isPending) };
    },
  });
}
