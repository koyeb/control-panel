import clsx from 'clsx';
import { Fragment } from 'react/jsx-runtime';

import { useFormValues } from 'src/hooks/form';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { HealthCheckFields } from './health-check-fields';
import { HealthCheckProtocol } from './health-check-protocol';

const T = createTranslate('modules.serviceForm.healthChecks');

export function HealthChecksSection() {
  const ports = useFormValues<ServiceForm>().ports;

  return (
    <ServiceFormSection
      section="healthChecks"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
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

function SectionTitle() {
  const ports = useWatchServiceForm('ports').filter((port) => !Number.isNaN(port.portNumber));
  const firstPort = ports[0];

  if (firstPort && ports.length === 1) {
    return (
      <T
        id="titleSingleHealthCheck"
        values={{
          protocol: <HealthCheckProtocol protocol={firstPort.healthCheck.protocol} />,
          portNumber: firstPort?.portNumber,
        }}
      />
    );
  }

  return <T id="titleMultipleHealthChecks" values={{ count: ports.length }} />;
}
