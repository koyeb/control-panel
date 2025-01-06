import { useWatch } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('databaseForm.serviceName');

export function ServiceNameSection() {
  const serviceId = useWatch<DatabaseServiceForm, 'meta.databaseServiceId'>({
    name: 'meta.databaseServiceId',
  });

  const serviceName = useWatch<DatabaseServiceForm, 'serviceName'>({ name: 'serviceName' });

  return (
    <DatabaseServiceFormSection
      section="serviceName"
      title={serviceName || <T id="serviceNameMissing" />}
      expandedTitle={<T id="expandedTitle" />}
      shortcut={serviceId ? 2 : 5}
      description={<T id="description" />}
    >
      <ControlledInput<DatabaseServiceForm, 'serviceName'>
        name="serviceName"
        label={<T id="serviceNameLabel" />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}
