import clsx from 'clsx';
import IconCircleAlert from 'lucide-static/icons/circle-alert.svg?react';
import IconCircleCheck from 'lucide-static/icons/circle-check.svg?react';
import IconCirclePause from 'lucide-static/icons/circle-pause.svg?react';

import { Spinner, Tooltip } from '@koyeb/design-system';
import { Service, ServiceStatus } from 'src/api/model';
import { getServiceLink } from 'src/application/service-functions';
import { Link } from 'src/components/link';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Translate } from 'src/intl/translate';

export function ServiceName({ service }: { service: Service }) {
  return (
    <div className="row items-center gap-4 whitespace-nowrap">
      <ServiceTypeIcon type={service.type} />

      <div className="col min-w-0 gap-2">
        <div className="row items-center gap-2">
          <Tooltip content={service.name}>
            {(props) => (
              <Link
                {...props}
                href={getServiceLink(service)}
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
          <Translate id={`common.serviceType.${service.type}`} />
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

const icons: Record<ServiceStatus, [React.ComponentType<React.SVGProps<SVGSVGElement>>, string]> = {
  starting: [Spinner, ''],
  healthy: [IconCircleCheck, clsx('text-green')],
  degraded: [IconCircleAlert, clsx('text-orange')],
  unhealthy: [IconCircleAlert, clsx('text-red')],
  deleting: [Spinner, ''],
  deleted: [Spinner, ''],
  pausing: [IconCirclePause, clsx('text-orange')],
  paused: [IconCirclePause, clsx('text-orange')],
  resuming: [Spinner, ''],
};
