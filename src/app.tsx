// eslint-disable-next-line no-restricted-imports
import { Redirect, Route, Switch } from 'wouter';

import { isAccountLockedError } from './api/api-errors';
import { useOrganizationQuery, useUserQuery } from './api/hooks/session';
import { useIdentifyUser } from './application/analytics';
import { useOnboardingStep } from './application/onboarding';
import { routes } from './application/routes';
import { AccountLocked } from './components/account-locked';
import { LinkButton } from './components/link';
import { Loading } from './components/loading';
import { Translate } from './intl/translate';
import { MainLayout } from './layouts/main/main-layout';
import { ConfirmDeactivateOrganization } from './modules/account/confirm-deactivate-organization';
import { CommandPalette } from './modules/command-palette/command-palette';
import { AccountPages } from './pages/account/account.pages';
import { ActivityPage } from './pages/activity/activity.page';
import { AuthenticationPages } from './pages/authentication/authentication.pages';
import { CreateDatabasePage } from './pages/databases/create-database.page';
import { DatabaseServicePages } from './pages/databases/database/database.pages';
import { DomainsPage } from './pages/domains/domains.page';
import { ErrorTestPage } from './pages/error-test.page';
import { GithubAppCallbackPage } from './pages/github-app-callback';
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
import { VolumesPage } from './pages/volumes/volumes.page';

export function App() {
  const userQuery = useUserQuery();
  const organizationQuery = useOrganizationQuery();

  useIdentifyUser();

  if (
    isAccountLockedError(userQuery.error) ||
    isAccountLockedError(organizationQuery.error) ||
    organizationQuery.data?.statusMessage === 'verification_failed'
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

  if (!userQuery.isSuccess || organizationQuery.isPending) {
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
      <CommandPalette />

      <Switch>
        <Route path="/" component={HomePage} />

        <Route path="/services" component={ServicesPage} />
        <Route path="/volumes" component={VolumesPage} />
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

        <Route path="/api/app/github/callback" component={GithubAppCallbackPage} />
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
