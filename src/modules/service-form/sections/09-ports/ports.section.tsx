import { useFieldArray } from 'react-hook-form';

import { Button } from '@koyeb/design-system';
import { IconPlus } from 'src/components/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { defaultHealthCheck } from '../../helpers/initialize-service-form';
import { useWatchServiceForm } from '../../use-service-form';

import { PortFields } from './port-fields';

const T = createTranslate('serviceForm.ports');

export function PortsSection() {
  const { fields, append, remove } = useFieldArray({ name: 'ports' });

  return (
    <ServiceFormSection
      section="ports"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gaps"
    >
      <p>
        <T id="info" />
      </p>

      <div className="col gap-4">
        {fields.map((port, index) => (
          <PortFields
            key={port.id}
            index={index}
            canRemove={fields.length > 1}
            onRemove={() => remove(index)}
          />
        ))}

        {fields.length === 0 && (
          <div className="rounded border px-3 py-4">
            <T id="noPorts" />
          </div>
        )}
      </div>

      <div className="row gap-2">
        <Button
          variant="ghost"
          color="gray"
          onClick={() =>
            append({
              portNumber: '',
              protocol: 'http',
              path: '/',
              public: true,
              healthCheck: defaultHealthCheck(),
            })
          }
        >
          <IconPlus className="size-4" />
          <T id="addPort" />
        </Button>
      </div>
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const ports = useWatchServiceForm('ports').filter((port) => !Number.isNaN(port.portNumber));
  const firstPort = ports[0];

  if (ports.length === 1) {
    return (
      <T
        id="titleSinglePort"
        values={{
          portNumber: firstPort?.portNumber,
          public: firstPort?.public,
          path: firstPort?.path,
        }}
      />
    );
  }

  return <T id="titleMultiplePorts" values={{ count: ports.length }} />;
}
