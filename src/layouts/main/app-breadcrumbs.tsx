import { Floating, Menu } from '@koyeb/design-system';
import { RegisteredRouter, ValidateLinkOptions, linkOptions, useRouterState } from '@tanstack/react-router';
import clsx from 'clsx';
import { Fragment, useState } from 'react';

import { useAppQuery, useServiceQuery, useServices } from 'src/api';
import { Link, LinkMenuItem } from 'src/components/link';
import { TextSkeleton } from 'src/components/skeleton';
import { ServiceStatusDot } from 'src/components/status-dot';
import { IconCheck, IconChevronDown, IconChevronRight, IconHouse } from 'src/icons';
import { Translate, TranslationKeys } from 'src/intl/translate';
import { Service } from 'src/model';
import { unique } from 'src/utils/arrays';
import { isDefined } from 'src/utils/generic';

export function AppBreadcrumbs() {
  const matches = useRouterState({ select: (s) => s.matches });
  const crumbs = unique(matches.map((match) => match.context.breadcrumb).filter(isDefined));

  if (crumbs.length === 0) {
    return <div className="h-14" />;
  }

  return (
    <div className="row h-14 items-center gap-2 overflow-x-auto whitespace-nowrap">
      <Link to="/" className="font-medium text-dim">
        <IconHouse className="icon" />
      </Link>

      {crumbs.map((Crumb, index) => (
        <Fragment key={index}>
          <div>
            <IconChevronRight className="size-em text-dim" />
          </div>

          <Crumb />
        </Fragment>
      ))}
    </div>
  );
}

export function Crumb({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx('font-medium text-dim last-of-type:text-default', className)}>{children}</div>;
}

export function CrumbLink<Router extends RegisteredRouter, Options>(
  props: ValidateLinkOptions<Router, Options> & { children?: React.ReactNode },
) {
  return (
    <Crumb>
      <Link {...props}>
        {props.children ?? (
          <Translate id={`layouts.main.breadcrumbs.${props.to as string}` as TranslationKeys} />
        )}
      </Link>
    </Crumb>
  );
}

export function AppServiceCrumb<Router extends RegisteredRouter, Options>({
  serviceId,
  link,
}: {
  serviceId: string;
  link: ValidateLinkOptions<Router, Options>;
}) {
  const serviceQuery = useServiceQuery(serviceId);
  const appQuery = useAppQuery(serviceQuery.data?.appId);

  if (appQuery.isError || serviceQuery.isError) {
    return null;
  }

  if (appQuery.isPending || serviceQuery.isPending) {
    return <TextSkeleton width={8} />;
  }

  const app = appQuery.data;
  const service = serviceQuery.data;

  return (
    <Crumb className="row items-center gap-2">
      <Link className="row max-w-48 items-center gap-2 sm:max-w-96 lg:max-w-none" {...link}>
        <div>
          <ServiceStatusDot status={service.status} className="size-2" />
        </div>

        <div className="truncate direction-rtl">
          <Translate id="common.appServiceName" values={{ appName: app.name, serviceName: service.name }} />
        </div>
      </Link>

      <ServiceSwitcherMenu appId={app.id} serviceId={serviceId} />
    </Crumb>
  );
}

export function ServiceSwitcherMenu({ appId, serviceId }: { appId: string; serviceId: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const appServices = useServices(appId);

  const linkProps = (service: Service) => {
    if (service.type === 'database') {
      return linkOptions({
        to: '/database-services/$databaseServiceId',
        params: { databaseServiceId: service.id },
      });
    }

    return linkOptions({
      to: '/services/$serviceId',
      params: { serviceId: service.id },
    });
  };

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
            <LinkMenuItem key={service.id} onClick={() => setMenuOpen(false)} {...linkProps(service)}>
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
