import clsx from 'clsx';
import { createElement } from 'react';

import { Activity, ServiceType } from 'src/api/model';
import { routes } from 'src/application/routes';
import { IconFolders } from 'src/components/icons';
import { Link } from 'src/components/link';
import { RegionFlag } from 'src/components/region-flag';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { createTranslate, Translate } from 'src/intl/translate';

import {
  isAutoscalingActivity,
  isDeploymentObject,
  isDomainObject,
  isInvitationObject,
  isSecretObject,
  isServiceObject,
  isVolumeActivity,
} from './activity-guards';

const T = createTranslate('components.activity.sentences');

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

        <RegionResource regionId={region} />
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

  if (isVolumeActivity(activity)) {
    const { app_name: appName, service_id: serviceId, service_name: serviceName } = activity.metadata;
    const { deleted } = object;

    return (
      <div className="row max-w-full flex-wrap gap-x-4 gap-y-2">
        <VolumeResource name={activity.object.name} deleted={activity.object.deleted} />
        {appName && serviceName && serviceId && (
          <ServiceResource
            appName={appName}
            serviceName={serviceName}
            serviceId={serviceId}
            link={routes.service.overview(serviceId)}
            deleted={deleted}
          />
        )}
      </div>
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

function RegionResource({ regionId }: { regionId: string }) {
  return (
    <ActivityResource className="min-w-max">
      <RegionFlag regionId={regionId} className="size-4" />
      <span className="uppercase">{regionId}</span>
    </ActivityResource>
  );
}

function VolumeResource({ name, deleted }: { name: string; deleted: boolean }) {
  const [component, props] = deleted
    ? [undefined, {}]
    : [Link, { href: routes.volumes.index(), className: 'hover:bg-muted/50' }];

  return (
    <ActivityResource component={component} {...props}>
      <span className="rounded bg-green p-0.5">
        <IconFolders className="size-3 text-white" />
      </span>

      {name}

      <div className="font-normal capitalize text-dim">
        <T id="volume" />
      </div>
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
