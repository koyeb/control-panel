import { Spinner, Tooltip } from '@koyeb/design-system';
import clsx from 'clsx';

import { Service, ServiceStatus } from 'src/api/model';
import { getServiceLink } from 'src/application/service-functions';
import { SvgComponent } from 'src/application/types';
import { Link } from 'src/components/link';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { IconCircleAlert, IconCircleCheck, IconCirclePause } from 'src/icons';
import { TranslateEnum } from 'src/intl/translate';

export function ServiceName({ service }: { service: Service }) {
  return (
    <div className="row items-center gap-4 whitespace-nowrap">
      <ServiceTypeIcon type={service.type} />

      <div className="col min-w-0 gap-2">
        <div className="row items-center gap-2">
          <Tooltip className="max-w-none" content={service.name}>
            {(props) => (
              <Link
                {...props}
                {...getServiceLink(service)}
                className="max-w-48 truncate font-medium hover:underline"
              >
                {service.name}
              </Link>
            )}
          </Tooltip>

          <Tooltip content={<div className="capitalize">{service.status}</div>}>
            {(props) => (
              <div {...props}>
                <ServiceStatusIcon status={service.status} className="size-4" />
              </div>
            )}
          </Tooltip>
        </div>

        <span className="text-dim">
          <TranslateEnum enum="serviceType" value={service.type} />
        </span>
      </div>
    </div>
  );
}

type ServiceIconProps = React.SVGProps<SVGSVGElement> & {
  status: ServiceStatus;
};

function ServiceStatusIcon({ status, ...props }: ServiceIconProps) {
  const [Icon, className] = icons[status];

  return <Icon {...props} className={clsx(className, props.className)} />;
}

const icons: Record<ServiceStatus, [SvgComponent, string]> = {
  STARTING: [Spinner, ''],
  HEALTHY: [IconCircleCheck, clsx('text-green')],
  DEGRADED: [IconCircleAlert, clsx('text-orange')],
  UNHEALTHY: [IconCircleAlert, clsx('text-red')],
  DELETING: [Spinner, ''],
  DELETED: [Spinner, ''],
  PAUSING: [IconCirclePause, clsx('text-orange')],
  PAUSED: [IconCirclePause, clsx('text-orange')],
  RESUMING: [Spinner, ''],
};
