import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';

import { useFormValues } from 'src/hooks/form';
import { TranslateEnum, createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { HealthCheckFields } from './health-check-fields';

const T = createTranslate('modules.serviceForm.healthChecks');

export function HealthChecksSection() {
  const ports = useFormValues<ServiceForm>().ports;

  return (
    <ServiceFormSection
      section="healthChecks"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
    >
      {ports.map((port, index) => (
        <Fragment key={index}>
          <HealthCheckFields port={port} index={index} />
          <hr className={clsx('my-4', index === ports.length - 1 && 'hidden')} />
        </Fragment>
      ))}
    </ServiceFormSection>
  );
}

function Summary() {
  const ports = useWatchServiceForm('ports').filter((port) => !Number.isNaN(port.portNumber));
  const firstPort = ports[0];

  if (firstPort && ports.length === 1) {
    return (
      <T
        id="summarySingleHealthCheck"
        values={{
          protocol: <TranslateEnum enum="portProtocol" value={firstPort.healthCheck.protocol} />,
          portNumber: firstPort?.portNumber,
        }}
      />
    );
  }

  return <T id="summaryMultipleHealthChecks" values={{ count: ports.length }} />;
}
