import { Badge, Button } from '@koyeb/design-system';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { IconPlus } from 'src/icons';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { defaultHealthCheck } from '../../helpers/initialize-service-form';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { PortFields } from './port-fields';

const T = createTranslate('modules.serviceForm.ports');

export function PortsSection() {
  const { fields, append, remove } = useFieldArray<ServiceForm>({ name: 'ports' });
  const { trigger } = useFormContext<ServiceForm>();

  const onRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
      void trigger('ports');
    }
  };

  return (
    <ServiceFormSection
      section="ports"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gap-6"
    >
      {fields.map(({ id }, index) => (
        <PortFields key={id} index={index} onRemove={() => onRemove(index)} />
      ))}

      <Button
        color="gray"
        onClick={() => {
          append({
            portNumber: NaN,
            protocol: 'http',
            path: '/',
            public: true,
            tcpProxy: false,
            healthCheck: defaultHealthCheck(),
          });
        }}
        className="self-start"
      >
        <IconPlus className="size-4" />
        <T id="addPort" />
      </Button>
    </ServiceFormSection>
  );
}

function Summary() {
  const ports = useWatchServiceForm('ports').filter((port) => !Number.isNaN(port.portNumber));

  return (
    <div className="row items-center gap-2">
      <T
        id="summary"
        values={{
          count: ports.length,
          badge: (children) => (
            <Badge size={1} color="green">
              {children}
            </Badge>
          ),
        }}
      />
    </div>
  );
}
