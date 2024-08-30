import { useFormState } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

const T = Translate.prefix('serviceForm.serviceName');

export function ServiceNameSection() {
  const { errors } = useFormState<ServiceForm>();

  return (
    <ServiceFormSection
      section="serviceName"
      description={<T id="description" />}
      title={<SectionTitle />}
      expandedTitle={<T id="titleExpanded" />}
    >
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
