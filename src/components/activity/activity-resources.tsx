import clsx from 'clsx';
import { createElement } from 'react';

import { Activity, ServiceType } from 'src/api/model';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Translate } from 'src/intl/translate';

import {
  isAutoscalingActivity,
  isDeploymentObject,
  isDomainObject,
  isInvitationObject,
  isSecretObject,
  isServiceObject,
} from './activity-guards';

export function ActivityResources({ activity }: { activity: Activity }) {
  const object = activity.object;

  if (isDomainObject(object) || isSecretObject(object)) {
    return <ActivityResource>{object.name}</ActivityResource>;
  }

  if (isAutoscalingActivity(activity)) {
    const { deleted } = activity.object;
    const { region } = activity.metadata;
    const { app_name: appName, service_id: serviceId, service_name: serviceName } = activity.object.metadata;

    return (
      <div className="row max-w-full flex-wrap gap-x-4 gap-y-2">
        <ServiceResource
          appName={appName}
          serviceName={serviceName}
          serviceId={serviceId}
          deleted={deleted}
        />

        <RegionResource identifier={region} />
      </div>
    );
  }

  if (isServiceObject(object)) {
    const { id: serviceId, name: serviceName, deleted } = object;
    const { app_name: appName, service_type: type } = object.metadata;

    return (
      <ServiceResource
        appName={appName}
        serviceName={serviceName}
        serviceId={serviceId}
        serviceType={type}
        deleted={deleted}
      />
    );
  }

  if (isDeploymentObject(object)) {
    const { id: deploymentId, deleted } = object;
    const { app_name: appName } = object.metadata;
    const { service_id: serviceId, service_name: serviceName } = object.metadata;

    return (
      <ServiceResource
        appName={appName}
        serviceName={serviceName}
        serviceId={serviceId}
        link={routes.service.overview(serviceId, deploymentId)}
        deleted={deleted}
      />
    );
  }

  if (isInvitationObject(object)) {
    return <ActivityResource>{object.metadata.email}</ActivityResource>;
  }

  return null;
}

type ServiceResourceProps = {
  appName: string;
  serviceName: string;
  serviceId: string;
  serviceType?: ServiceType;
  link?: string;
  deleted?: boolean;
  className?: string;
};

function ServiceResource({
  appName,
  serviceName,
  serviceId,
  serviceType,
  link,
  deleted,
}: ServiceResourceProps) {
  const props: Record<string, unknown> = {};

  if (!deleted) {
    props.component = Link;
    props.className = 'hover:bg-muted/50';

    if (link) {
      props.href = link;
    } else if (serviceType === 'database') {
      props.href = routes.database.overview(serviceId);
    } else {
      props.href = routes.service.overview(serviceId);
    }
  }

  return (
    <ActivityResource {...props}>
      {serviceType && <ServiceTypeIcon size="small" type={serviceType} />}

      <span className="direction-rtl truncate">
        <Translate id="common.appServiceName" values={{ appName, serviceName }} />
      </span>

      {serviceType && (
        <div className="font-normal text-dim">
          <Translate id={`common.serviceType.${serviceType}`} />
        </div>
      )}
    </ActivityResource>
  );
}

function RegionResource({ identifier }: { identifier: string }) {
  return (
    <ActivityResource className="min-w-max">
      <RegionFlag identifier={identifier} className="size-4 rounded-full shadow-badge" />
      <span className="uppercase">{identifier}</span>
    </ActivityResource>
  );
}

type ActivityResourceProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: string | React.ComponentType<any>;
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
};

function ActivityResource({ component = 'div', className, children, ...props }: ActivityResourceProps) {
  return createElement(
    component,
    {
      className: clsx(
        'row min-w-0 max-w-full items-center gap-2 whitespace-nowrap rounded border px-2 py-1 text-xs font-medium',
        className,
      ),
      ...props,
    },
    children,
  );
}
