import { ServiceType } from 'src/api/model';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate } from 'src/intl/translate';

import { ServiceTypeItem } from './components/service-type-item';

const T = Translate.prefix('serviceCreation.serviceType');

export type ExtendedServiceType = ServiceType | 'private' | 'model';

type ServiceTypeListProps = {
  serviceType: string | null;
  setServiceType: (type: string) => void;
};

export function ServiceTypeList({ serviceType, setServiceType }: ServiceTypeListProps) {
  const serviceTypes: ExtendedServiceType[] = ['web', 'private', 'worker', 'database'];

  if (useFeatureFlag('ai-onboarding')) {
    serviceTypes.push('model');
  }

  return (
    <>
      <span className="font-medium text-dim">
        <T id="navigation.createService" />
      </span>

      <ul className="col gap-2">
        {serviceTypes.map((type) => (
          <ServiceTypeItem
            key={type}
            icon={<ServiceTypeIcon type={type} />}
            label={<Translate id={`common.serviceType.${type}`} />}
            active={type === serviceType}
            onClick={() => setServiceType(type)}
          />
        ))}
      </ul>
    </>
  );
}
