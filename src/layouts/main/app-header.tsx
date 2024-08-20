// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';
import { usePathname } from 'wouter/use-browser-location';

import { useAppQuery, useServiceQuery } from 'src/api/hooks/service';
import { routes } from 'src/application/routes';
import { Breadcrumbs, Crumb } from 'src/components/breadcrumbs';
import { TextSkeleton } from 'src/components/skeleton';
import { ServiceStatusDot } from 'src/components/status-dot';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('layouts.main.breadcrumbs');

export function AppHeader() {
  return (
    <div className="row flex-wrap-reverse items-center justify-between gap-4">
      <AppBreadcrumbs />
    </div>
  );
}

function AppBreadcrumbs() {
  const pathname = usePathname();

  if (pathname === '/') {
    return <div />;
  }

  return (
    <Breadcrumbs>
      <Switch>
        <CrumbRoute path="/services" label={<T id="services" />} link={routes.services()} />
        <CrumbRoute path="/volumes" label={<T id="volumes" />} link={routes.volumes()} />
        <CrumbRoute path="/domains" label={<T id="domains" />} link={routes.deploy()} />
        <CrumbRoute path="/secrets" label={<T id="secrets" />} link={routes.secrets()} />
        <CrumbRoute path="/activity" label={<T id="activity" />} link={routes.activity()} />
        <CrumbRoute path="/team" label={<T id="team" />} link={routes.team()} />

        <CrumbRoute
          path="/database-services/new"
          label={<T id="createService" />}
          link={routes.createService()}
        />

        <CrumbRoute
          path="/services/deploy"
          label={<T id="deploy" />}
          link={routes.deploy() + window.location.search}
        />

        <CrumbRoute path="/services/new" label={<T id="createService" />} link={routes.createService()} />

        <Route path="/database-services/:serviceId/*?">
          {({ serviceId }) => <DatabaseServiceCrumbs serviceId={serviceId} />}
        </Route>

        <Route path="/services/:serviceId/*?">
          {({ serviceId }) => <ServiceCrumbs serviceId={serviceId} />}
        </Route>

        <Route path="/settings/*?">
          <OrganizationSettingsCrumbs />
        </Route>

        <Route path="/user/settings/*?">
          <UserSettingsCrumbs />
        </Route>
      </Switch>
    </Breadcrumbs>
  );
}

function OrganizationSettingsCrumbs() {
  return (
    <>
      <CrumbRoute
        path="/settings/*?"
        label={<T id="organizationSettings.index" />}
        link={routes.organizationSettings.index()}
      />

      <CrumbRoute
        path="/settings/billing"
        label={<T id="organizationSettings.billing" />}
        link={routes.organizationSettings.billing()}
      />

      <CrumbRoute
        path="/settings/plans"
        label={<T id="organizationSettings.plans" />}
        link={routes.organizationSettings.plans()}
      />

      <CrumbRoute
        path="/settings/api"
        label={<T id="organizationSettings.api" />}
        link={routes.organizationSettings.api()}
      />
    </>
  );
}

function UserSettingsCrumbs() {
  return (
    <>
      <CrumbRoute
        path="/user/settings/*?"
        label={<T id="userSettings.index" />}
        link={routes.userSettings.index()}
      />

      <CrumbRoute
        path="/user/settings/organizations"
        label={<T id="userSettings.organizations" />}
        link={routes.userSettings.organizations()}
      />

      <CrumbRoute
        path="/user/settings/api"
        label={<T id="userSettings.api" />}
        link={routes.userSettings.api()}
      />
    </>
  );
}

function ServiceCrumbs({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (!appQuery.isSuccess || !serviceQuery.isSuccess) {
    return <Crumb label={<TextSkeleton width={8} />} link="#" />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <>
      <Crumb
        label={
          <span className="row items-center gap-2">
            <ServiceStatusDot status={service.status} className="size-2" />
            <Translate id="common.appServiceName" values={{ appName: app.name, serviceName: service.name }} />
          </span>
        }
        link={routes.service.overview(serviceId)}
      />

      <CrumbRoute
        path="/services/:serviceId/metrics"
        label={<T id="service.metrics" />}
        link={routes.service.metrics(serviceId)}
      />

      <CrumbRoute
        path="/services/:serviceId/console"
        label={<T id="service.console" />}
        link={routes.service.console(serviceId)}
      />

      <CrumbRoute
        path="/services/:serviceId/settings"
        label={<T id="service.settings" />}
        link={routes.service.settings(serviceId)}
      />
    </>
  );
}

function DatabaseServiceCrumbs({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (!appQuery.isSuccess || !serviceQuery.isSuccess) {
    return <Crumb label={<TextSkeleton width={8} />} link="#" />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <>
      <Crumb
        label={
          <Translate id="common.appServiceName" values={{ appName: app.name, serviceName: service.name }} />
        }
        link={routes.database.overview(serviceId)}
      />

      <CrumbRoute
        path="/database-services/:serviceId/databases"
        label={<T id="database.databases" />}
        link={routes.database.logicalDatabases(serviceId)}
      />

      <CrumbRoute
        path="/database-services/:serviceId/roles"
        label={<T id="database.roles" />}
        link={routes.database.roles(serviceId)}
      />

      <CrumbRoute
        path="/database-services/:serviceId/settings"
        label={<T id="database.settings" />}
        link={routes.database.settings(serviceId)}
      />
    </>
  );
}

function CrumbRoute({ path, ...props }: { path: string } & React.ComponentProps<typeof Crumb>) {
  return (
    <Route path={path}>
      <Crumb {...props} />
    </Route>
  );
}
