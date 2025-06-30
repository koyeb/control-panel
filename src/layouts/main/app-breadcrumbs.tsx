import { Floating, Menu, MenuItem } from '@koyeb/design-system';
import clsx from 'clsx';
import { useState } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Route, Switch } from 'wouter';

import { useAppQuery, useServiceQuery, useServices } from 'src/api/hooks/service';
import { routes } from 'src/application/routes';
import { Breadcrumbs, Crumb } from 'src/components/breadcrumbs';
import { IconCheck, IconChevronDown, IconHouse } from 'src/components/icons';
import { Link } from 'src/components/link';
import { TextSkeleton } from 'src/components/skeleton';
import { ServiceStatusDot } from 'src/components/status-dot';
import { usePathname } from 'src/hooks/router';
import { Translate, createTranslate } from 'src/intl/translate';

const T = createTranslate('layouts.main.breadcrumbs');

export function AppBreadcrumbs() {
  const pathname = usePathname();

  return (
    <Breadcrumbs className="h-14 overflow-x-auto">
      {pathname !== routes.home() && (
        <Crumb
          isFirst
          label={
            <div>
              <IconHouse className="icon" />
            </div>
          }
          link={routes.home()}
        />
      )}

      <Switch>
        <CrumbRoute path="/services" label={<T id="services" />} link={routes.services()} />

        <Route path="/volumes">
          <Crumb label={<T id="volumes" />} link={routes.volumes.index()} />
          <CrumbRoute
            path="/snapshots"
            label={<T id="volumeSnapshots" />}
            link={routes.volumes.snapshots()}
          />
        </Route>

        <CrumbRoute path="/domains" label={<T id="domains" />} link={routes.domains()} />
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
  return (
    <>
      <AppServiceCrumb serviceId={serviceId} />

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
  return (
    <>
      <AppServiceCrumb serviceId={serviceId} />

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

function AppServiceCrumb({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (!appQuery.isSuccess || !serviceQuery.isSuccess) {
    return <Crumb label={<TextSkeleton width={8} />} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <div className="row items-center gap-2">
      <Crumb
        link={
          service.type === 'database'
            ? routes.database.overview(service.id)
            : routes.service.overview(service.id)
        }
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

      <ServiceSwitcherMenu appId={appQuery.data?.id} serviceId={serviceId} />
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
            <MenuItem
              key={service.id}
              element={Link}
              href={
                service.type === 'database'
                  ? routes.database.overview(service.id)
                  : routes.service.overview(service.id)
              }
              onClick={() => setMenuOpen(false)}
            >
              <div>
                <ServiceStatusDot status={service.status} className="size-2" />
              </div>

              {service.name}

              {service.id === serviceId && <IconCheck className="ml-auto size-4 text-icon" />}
            </MenuItem>
          ))}
        </Menu>
      )}
    />
  );
}
