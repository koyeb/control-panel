import { useMutation } from '@tanstack/react-query';
// eslint-disable-next-line no-restricted-imports
import { Redirect, Route, Switch, useRoute } from 'wouter';

import { isAccountLockedError } from './api/api-errors';
import { useOrganizationQuery, useUserQuery } from './api/hooks/session';
import { useApiMutationFn, useInvalidateApiQuery } from './api/use-api';
import { useOnboardingStep } from './application/onboarding';
import { routes } from './application/routes';
import { useRefreshToken, useToken } from './application/token';
import { LinkButton } from './components/link';
import { Loading } from './components/loading';
import { useMount } from './hooks/lifecycle';
import { useSearchParam } from './hooks/router';
import { useSeon } from './hooks/seon';
import { Translate } from './intl/translate';
import { MainLayout } from './layouts/main/main-layout';
import { AccountLocked } from './modules/account/account-locked';
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

  useRefreshToken();

  if (useOrganizationContextParam()) {
    return null;
  }

  if (
    isAccountLockedError(userQuery.error) ||
    isAccountLockedError(organizationQuery.error) ||
    organizationQuery.data?.statusMessage === 'VERIFICATION_FAILED'
  ) {
    return <AccountLocked />;
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
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  const onboardingStep = useOnboardingStep();
  const trial = useTrial();

  const [confirmDeactivateOrganization, params] = useRoute(
    '/organization/deactivate/confirm/:confirmationId',
  );

  if (!userQuery.isSuccess || organizationQuery.isPending) {
    return (
      <Loading>
        <MainLayout />
      </Loading>
    );
  }

  if (confirmDeactivateOrganization) {
    return <ConfirmDeactivateOrganization confirmationId={params.confirmationId} />;
  }

  if (trial?.ended) {
    return <TrialEnded />;
  }

  if (onboardingStep !== null) {
    return <OnboardingPage step={onboardingStep} />;
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

function useOrganizationContextParam() {
  const [organizationIdParam, setOrganizationIdParam] = useSearchParam('organization-id');
  const { setToken } = useToken();
  const invalidate = useInvalidateApiQuery();
  const getSeonFingerprint = useSeon();

  const mutation = useMutation({
    ...useApiMutationFn('switchOrganization', async (organizationId: string) => ({
      path: { id: organizationId },
      header: { 'seon-fp': await getSeonFingerprint() },
    })),
    async onSuccess({ token }) {
      setToken(token!.id!);
      await invalidate('getCurrentOrganization');
    },
    onSettled() {
      setOrganizationIdParam(null);
    },
  });

  useMount(() => {
    if (organizationIdParam !== null) {
      mutation.mutate(organizationIdParam);
    }
  });

  return organizationIdParam !== null;
}
