import { useWatch } from 'react-hook-form';

import { ServiceType } from 'src/api/model';
import { ControlledSelectBox } from 'src/components/controlled';
import { IconSettings, IconGlobe } from 'src/components/icons';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';
import { useWatchServiceForm } from '../../use-service-form';

import { ServiceTypeAlerts } from './service-type-alerts';

const T = Translate.prefix('serviceForm.serviceType');

export function ServiceTypeSection() {
  return (
    <ServiceFormSection
      section="serviceType"
      description={<T id="description" />}
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6"
    >
      <ServiceTypeAlerts />

      <div className="gaps grid grid-cols-1 md:grid-cols-2">
        <ServiceTypeOption
          type="web"
          Icon={IconGlobe}
          title={<T id="webService" />}
          description={<T id="webServiceDescription" />}
        />

        <ServiceTypeOption
          type="worker"
          Icon={IconSettings}
          title={<T id="worker" />}
          description={<T id="workerDescription" />}
        />
      </div>
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const serviceType = useWatch<ServiceForm, 'serviceType'>({ name: 'serviceType' });

  const { Icon, title } =
    serviceType === 'web'
      ? { Icon: IconGlobe, title: <T id="webService" /> }
      : { Icon: IconSettings, title: <T id="worker" /> };

  return (
    <div className="row items-center gap-2">
      <Icon className="icon" />
      {title}
    </div>
  );
}

type ServiceTypeOptionProps = {
  type: ServiceType;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: React.ReactNode;
  description: React.ReactNode;
};

function ServiceTypeOption({ type, Icon, title, description }: ServiceTypeOptionProps) {
  const instanceIdentifier = useWatchServiceForm('instance');

  const canSelect = () => {
    if (instanceIdentifier === 'free') {
      return type !== 'worker';
    }

    return true;
  };

  return (
    <ControlledSelectBox
      name="serviceType"
      value={type}
      type="radio"
      disabled={!canSelect()}
      icon={<Icon className="icon" />}
      title={title}
      description={description}
      className="flex-1"
    />
  );
}
