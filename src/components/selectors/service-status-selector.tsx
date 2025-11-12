import { translateStatus } from 'src/intl/translate';
import { ServiceStatus } from 'src/model';

import { ServiceStatusDot } from '../status-dot';

import { StatusesSelector } from './statuses-selector';

type ServiceStatusSelectorProps = Partial<React.ComponentProps<typeof StatusesSelector<ServiceStatus>>>;

export function ServiceStatusesSelector(props: ServiceStatusSelectorProps) {
  const renderItem = (status: ServiceStatus) => {
    if (status === 'PAUSED') {
      return [translateStatus('PAUSING'), translateStatus('PAUSED')].join(' / ');
    }

    if (status === 'DELETED') {
      return [translateStatus('DELETING'), translateStatus('DELETED')].join(' / ');
    }

    return translateStatus(status);
  };

  return (
    <StatusesSelector<ServiceStatus>
      statuses={['STARTING', 'RESUMING', 'HEALTHY', 'DEGRADED', 'UNHEALTHY', 'PAUSED', 'DELETED']}
      dropdown={{ floating: { placement: 'bottom-end' }, matchReferenceSize: false }}
      renderItem={renderItem}
      Dot={ServiceStatusDot}
      menuClassName="min-w-56"
      {...props}
    />
  );
}
