import { Floating, Menu } from '@koyeb/design-system';
import clsx from 'clsx';
import { useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { ApiError } from 'src/api/api-errors';
import { useAppQuery } from 'src/api/hooks/app';
import { useOneClickAppQuery } from 'src/api/hooks/catalog';
import { useServiceQuery, useServices } from 'src/api/hooks/service';
import { Breadcrumbs, Crumb } from 'src/components/breadcrumbs';
import { LinkMenuItem } from 'src/components/link';
import { TextSkeleton } from 'src/components/skeleton';
import { ServiceStatusDot } from 'src/components/status-dot';
import { usePathname } from 'src/hooks/router';
import { IconCheck, IconChevronDown, IconHouse } from 'src/icons';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.breadcrumbs');

export function AppBreadcrumbs() {
  const pathname = usePathname();

  return (
    <Breadcrumbs className="h-14 overflow-x-auto">
      {pathname !== '/' && (
        <Crumb
          isFirst
          label={
            <div>
              <IconHouse className="icon" />
            </div>
          }
          link="/"
        />
      )}

      <Switch>
        <CrumbRoute path="/services" label={<T id="services" />} link="/services" />

        <Route path="/volumes/*?">
          <Crumb label={<T id="volumes.index" />} link="/volumes" />
          <CrumbRoute path="/volumes/new" label={<T id="volumes.create" />} link="/volumes/new" />
          <CrumbRoute
            path="/volumes/snapshots"
            label={<T id="volumes.snapshots" />}
            link="/volumes/snapshots"
          />
        </Route>

        <CrumbRoute path="/domains" label={<T id="domains" />} link="/domains" />
        <CrumbRoute path="/secrets" label={<T id="secrets" />} link="/secrets" />
        <CrumbRoute path="/activity" label={<T id="activity" />} link="/activity" />
        <CrumbRoute path="/team" label={<T id="team" />} link="/team" />

        <CrumbRoute
          path="/database-services/new"
          label={<T id="createService" />}
          link="/database-services/new"
        />

        <CrumbRoute
          path="/services/deploy"
          label={<T id="deploy" />}
          link={'/services/deploy' + window.location.search}
        />

        <CrumbRoute path="/services/new" label={<T id="createService" />} link="/services/new" />

        <Route path="/database-services/:serviceId/*?">
          {({ serviceId }) => <DatabaseServiceCrumbs databaseServiceId={serviceId} />}
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

        <Route path="/one-click-apps/*?">
          <Crumb link="/one-click-apps" label={<T id="oneClickApps.index" />} />

          <Route path="/one-click-apps/category/:category">
            {({ category }) => (
              <Crumb label={category} link="/one-click-apps/category/:category" params={{ category }} />
            )}
          </Route>

          <Route path="/one-click-apps/:slug/*?">{({ slug }) => <OneClickAppCrumbs slug={slug} />}</Route>
        </Route>
      </Switch>
    </Breadcrumbs>
  );
}

function OrganizationSettingsCrumbs() {
  return (
    <>
      <CrumbRoute path="/settings/*?" label={<T id="organizationSettings.index" />} link="/settings" />

      <CrumbRoute
        path="/settings/billing"
        label={<T id="organizationSettings.billing" />}
        link="/settings/billing"
      />

      <CrumbRoute
        path="/settings/plans"
        label={<T id="organizationSettings.plans" />}
        link="/settings/plans"
      />

      <CrumbRoute path="/settings/api" label={<T id="organizationSettings.api" />} link="/settings/api" />

      <CrumbRoute
        path="/settings/registry-configuration"
        label={<T id="organizationSettings.registryConfiguration" />}
        link="/settings/registry-configuration"
      />
    </>
  );
}

function UserSettingsCrumbs() {
  return (
    <>
      <CrumbRoute path="/user/settings/*?" label={<T id="userSettings.index" />} link="/user/settings" />

      <CrumbRoute
        path="/user/settings/organizations"
        label={<T id="userSettings.organizations" />}
        link="/user/settings/organizations"
      />

      <CrumbRoute path="/user/settings/api" label={<T id="userSettings.api" />} link="/user/settings/api" />
    </>
  );
}

function ServiceCrumbs({ serviceId }: { serviceId: string }) {
  return (
    <>
      <AppServiceCrumb serviceId={serviceId} />

      <CrumbRoute
        path="/services/:serviceId/metrics"
        label={<T id="service.metrics" />}
        link="/services/$serviceId/metrics"
        params={{ serviceId }}
      />

      <CrumbRoute
        path="/services/:serviceId/console"
        label={<T id="service.console" />}
        link="/services/$serviceId/console"
        params={{ serviceId }}
      />

      <CrumbRoute
        path="/services/:serviceId/settings"
        label={<T id="service.settings" />}
        link="/services/$serviceId/settings"
        params={{ serviceId }}
      />
    </>
  );
}

function DatabaseServiceCrumbs({ databaseServiceId }: { databaseServiceId: string }) {
  return (
    <>
      <AppServiceCrumb serviceId={databaseServiceId} />

      <CrumbRoute
        path="/database-services/:serviceId/databases"
        label={<T id="database.databases" />}
        link="/database-services/$databaseServiceId/databases"
        params={{ databaseServiceId }}
      />

      <CrumbRoute
        path="/database-services/:serviceId/roles"
        label={<T id="database.roles" />}
        link="/database-services/$databaseServiceId/roles"
        params={{ databaseServiceId }}
      />

      <CrumbRoute
        path="/database-services/:serviceId/settings"
        label={<T id="database.settings" />}
        link="/database-services/$databaseServiceId/settings"
        params={{ databaseServiceId }}
      />
    </>
  );
}

function OneClickAppCrumbs({ slug }: { slug: string }) {
  const query = useOneClickAppQuery(slug);

  if (query.isPending) {
    return <TextSkeleton width={8} />;
  }

  if (query.isError) {
    if (ApiError.is(query.error, 404)) {
      return <Crumb label={query.error.message} />;
    }

    return null;
  }

  return (
    <>
      <Crumb label={query.data.metadata.name} link={`/one-click-apps/$slug`} params={{ slug }} />

      <CrumbRoute
        path="/one-click-apps/:slug/deploy"
        label={<T id="oneClickApps.deploy" />}
        link="/one-click-apps/$slug/deploy"
        params={{ slug }}
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

function AppServiceCrumb({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (appQuery.isError || serviceQuery.isError) {
    return null;
  }

  if (appQuery.isPending || serviceQuery.isPending) {
    return <Crumb label={<TextSkeleton width={8} />} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <div className="row items-center gap-2">
      <Crumb
        link={service.type === 'database' ? '/database-services/$databaseServiceId' : '/services/$serviceId'}
        params={service.type === 'database' ? { databaseServiceId: serviceId } : { serviceId }}
        label={
          <div className="row max-w-48 items-center gap-2 sm:max-w-96 lg:max-w-none">
            <div>
              <ServiceStatusDot status={service.status} className="size-2" />
            </div>

            <div className="truncate direction-rtl">
              <Translate
                id="common.appServiceName"
                values={{ appName: app.name, serviceName: service.name }}
              />
            </div>
          </div>
        }
      />

      <ServiceSwitcherMenu appId={appQuery.data.id} serviceId={serviceId} />
    </div>
  );
}

function ServiceSwitcherMenu({ appId, serviceId }: { appId?: string; serviceId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const appServices = useServices(appId);

  return (
    <Floating
      open={menuOpen}
      setOpen={setMenuOpen}
      placement="bottom-start"
      offset={8}
      renderReference={(props) => (
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className={clsx({ hidden: !appServices || appServices.length <= 1 })}
          {...props}
        >
          <IconChevronDown className="size-4 text-icon" />
        </button>
      )}
      renderFloating={(props) => (
        <Menu className="min-w-48" {...props}>
          {appServices?.map((service) => (
            <LinkMenuItem
              key={service.id}
              to={
                service.type === 'database' ? '/database-services/$databaseServiceId' : '/services/$serviceId'
              }
              params={
                service.type === 'database' ? { databaseServiceId: service.id } : { serviceId: service.id }
              }
              onClick={() => setMenuOpen(false)}
            >
              <div>
                <ServiceStatusDot status={service.status} className="size-2" />
              </div>

              {service.name}

              {service.id === serviceId && <IconCheck className="ml-auto size-4 text-icon" />}
            </LinkMenuItem>
          ))}
        </Menu>
      )}
    />
  );
}
