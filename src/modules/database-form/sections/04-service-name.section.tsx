import { useWatch } from 'react-hook-form';

import { ControlledInput } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.serviceName');

export function ServiceNameSection() {
  const serviceId = useWatch<DatabaseServiceForm, 'meta.databaseServiceId'>({
    name: 'meta.databaseServiceId',
  });

  const serviceName = useWatch<DatabaseServiceForm, 'serviceName'>({ name: 'serviceName' });

  return (
    <DatabaseServiceFormSection
      section="serviceName"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={serviceName || <T id="serviceNameMissing" />}
      shortcut={serviceId ? 2 : 4}
    >
      <ControlledInput<DatabaseServiceForm, 'serviceName'>
        name="serviceName"
        label={<T id="serviceNameLabel" />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}
