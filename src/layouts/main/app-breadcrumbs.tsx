import clsx from 'clsx';
import { useState } from 'react';

import { Floating, Menu, MenuItem } from '@koyeb/design-system';
import { ParsedLocation, useRouterState } from '@tanstack/react-router';
import { useAppQuery, useServiceQuery, useServices } from 'src/api/hooks/service';
import { routes } from 'src/application/routes';
import { Breadcrumbs, Crumb } from 'src/components/breadcrumbs';
import { IconCheck, IconChevronDown, IconHouse } from 'src/components/icons';
import { Link } from 'src/components/link';
import { TextSkeleton } from 'src/components/skeleton';
import { ServiceStatusDot } from 'src/components/status-dot';
import { Translate, TranslationKeys } from 'src/intl/translate';
import { isDefined } from 'src/utils/generic';

type Prefix = `layouts.main.breadcrumbs`;
type BreadcrumbKey =
  Extract<TranslationKeys, `${Prefix}.${string}`> extends `${Prefix}.${infer K}` ? K : never;

// eslint-disable-next-line react-refresh/only-export-components
export function getBreadcrumb(location: ParsedLocation, key: BreadcrumbKey) {
  return {
    label: () => <Translate id={`layouts.main.breadcrumbs.${key}`} />,
    link: location.pathname + location.searchStr,
  };
}

export function AppBreadcrumbs() {
  const matches = useRouterState({ select: (s) => s.matches });
  const crumbs = matches.map((match) => match.context.breadcrumb).filter(isDefined);

  if (crumbs.length > 0) {
    crumbs.unshift({
      label: () => (
        <div>
          <IconHouse className="icon" />
        </div>
      ),
      link: '/',
    });
  }

  return (
    <Breadcrumbs className="h-14 overflow-x-auto">
      {crumbs.map((crumb, index) => (
        <Crumb key={index} isFirst={index === 0} label={crumb.label()} link={crumb.link} />
      ))}
    </Breadcrumbs>
  );
}

export function AppServiceCrumb({ serviceId }: { serviceId: string }) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (!appQuery.isSuccess || !serviceQuery.isSuccess) {
    return <Crumb label={<TextSkeleton width={8} />} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <div className="row items-center gap-2">
      <div className="row max-w-48 items-center gap-2 sm:max-w-96 lg:max-w-none">
        <div>
          <ServiceStatusDot status={service.status} className="size-2" />
        </div>

        <div className="direction-rtl truncate">
          <Translate id="common.appServiceName" values={{ appName: app.name, serviceName: service.name }} />
        </div>
      </div>

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
          <IconChevronDown className="text-icon size-4" />
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

              {service.id === serviceId && <IconCheck className="text-icon ml-auto size-4" />}
            </MenuItem>
          ))}
        </Menu>
      )}
    />
  );
}
