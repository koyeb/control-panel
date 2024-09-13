import { useFormState } from 'react-hook-form';

import { Alert } from '@koyeb/design-system';
import { ControlledInput } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.serviceName');

export function ServiceNameSection() {
  const serviceId = useWatchServiceForm('meta.serviceId');
  const { errors } = useFormState<ServiceForm>();

  return (
    <ServiceFormSection
      section="serviceName"
      description={<T id="description" />}
      title={<SectionTitle />}
      expandedTitle={<T id="titleExpanded" />}
      className="col gaps"
    >
      {serviceId !== null && <Alert variant="warning" description={<T id="editServiceNameWarning" />} />}

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

function SectionTitle() {
  const serviceName = useWatchServiceForm('serviceName');

  if (serviceName === '') {
    return <T id="titleServiceNameMissing" />;
  }

  return <div className="max-w-full truncate">{serviceName}</div>;
}
