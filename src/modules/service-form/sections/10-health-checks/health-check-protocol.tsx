import { Translate } from 'src/intl/translate';

import { type HealthCheckProtocol } from '../../service-form.types';

const T = Translate.prefix('serviceForm.healthChecks');

type HealthCheckProtocolProps = {
  protocol: HealthCheckProtocol;
};

export function HealthCheckProtocol({ protocol }: HealthCheckProtocolProps) {
  return {
    tcp: <T id="tcp" />,
    http: <T id="http" />,
  }[protocol];
}
