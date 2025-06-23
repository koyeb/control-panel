import { Button } from '@koyeb/design-system';
import { useFieldArray } from 'react-hook-form';

import { IconPlus } from 'src/components/icons';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { defaultHealthCheck } from '../../helpers/initialize-service-form';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { PortFields } from './port-fields';
import { PortFields as PortFieldsOld } from './port-fields.old';

const T = createTranslate('modules.serviceForm.ports');

export function PortsSection() {
  const { fields, append, remove } = useFieldArray<ServiceForm>({ name: 'ports' });

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
        <FeatureFlag
          feature="proxy-ports"
          fallback={fields.map((port, index) => (
            <PortFieldsOld
              key={port.id}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        >
          {fields.map((port, index) => (
            <PortFields
              key={port.id}
              index={index}
              canRemove={fields.length > 1}
              onRemove={() => remove(index)}
            />
          ))}
        </FeatureFlag>

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
              portNumber: NaN,
              protocol: 'http',
              path: '/',
              public: true,
              proxy: false,
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
