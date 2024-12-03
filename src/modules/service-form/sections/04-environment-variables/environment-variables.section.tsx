import { useFormContext } from 'react-hook-form';

import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';

import { EnvironmentVariables } from './environment-variables';

const T = Translate.prefix('serviceForm.environmentVariables');

export function EnvironmentVariablesSection() {
  const variables = useFormContext<ServiceForm>().watch('environmentVariables');

  return (
    <ServiceFormSection
      section="environmentVariables"
      title={<T id="title" values={{ count: variables.filter((field) => field.name !== '').length }} />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
    >
      <EnvironmentVariables />
    </ServiceFormSection>
  );
}
