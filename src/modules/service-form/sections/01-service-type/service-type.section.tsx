import { useCatalogInstance } from 'src/api';
import { SvgComponent } from 'src/application/types';
import { ControlledSelectBox } from 'src/components/forms';
import { IconGlobe, IconSettings } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { ServiceType } from 'src/model';
import { assert } from 'src/utils/assert';

import { ServiceFormSection } from '../../components/service-form-section';
import { useScalingRules } from '../../helpers/scaling-rules';
import { useWatchServiceForm } from '../../use-service-form';

import { ServiceTypeAlerts } from './service-type-alerts';

const T = createTranslate('modules.serviceForm.serviceType');

export function ServiceTypeSection() {
  return (
    <ServiceFormSection
      section="serviceType"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      className="col gap-6"
    >
      <ServiceTypeAlerts />

      <div className="grid grid-cols-1 gaps md:grid-cols-2">
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

function Summary() {
  const serviceType = useWatchServiceForm('serviceType');
  assert(serviceType !== 'database');

  const { Icon, title } = {
    web: { Icon: IconGlobe, title: <T id="webService" /> },
    worker: { Icon: IconSettings, title: <T id="worker" /> },
  }[serviceType];

  return (
    <div className="row items-center gap-2">
      <Icon className="size-4 text-icon" />
      {title}
    </div>
  );
}

type ServiceTypeOptionProps = {
  type: ServiceType;
  Icon: SvgComponent;
  title: React.ReactNode;
  description: React.ReactNode;
};

function ServiceTypeOption({ type, Icon, title, description }: ServiceTypeOptionProps) {
  const { onServiceTypeChanged } = useScalingRules();
  const instance = useCatalogInstance(useWatchServiceForm('instance'));

  const canSelect = () => {
    if (instance?.id === 'free') {
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
      onChangeEffect={() => onServiceTypeChanged(type)}
      className="flex-1"
    />
  );
}
