import { Alert } from '@koyeb/design-system';
import { useFormState } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';
import { capitalize } from 'src/utils/strings';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = createTranslate('modules.serviceForm.serviceName');

export function ServiceNameSection() {
  const serviceId = useWatchServiceForm('meta.serviceId');
  const type = useWatchServiceForm('serviceType') as 'web' | 'worker';
  const { errors } = useFormState<ServiceForm>();

  return (
    <ServiceFormSection
      section="serviceName"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gaps"
    >
      {serviceId !== null && (
        <Alert variant="warning" description={<T id={`editServiceNameWarning${capitalize(type)}`} />} />
      )}

      <ControlledInput
        name="serviceName"
        label={<T id="serviceNameLabel" />}
        helpTooltip={<T id="serviceNameTooltip" />}
        helperText={errors.serviceName?.message}
        className="max-w-md"
      />
    </ServiceFormSection>
  );
}

function Summary() {
  const serviceName = useWatchServiceForm('serviceName');

  if (serviceName === '') {
    return <T id="summaryServiceNameMissing" />;
  }

  return <div className="max-w-full truncate">{serviceName}</div>;
}
