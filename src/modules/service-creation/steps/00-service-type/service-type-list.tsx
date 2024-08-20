import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { Translate } from 'src/intl/translate';

import { ServiceTypeItem } from './components/service-type-item';

const T = Translate.prefix('serviceCreation.serviceType');

type ServiceTypeListProps = {
  serviceType: string | null;
  setServiceType: (type: string) => void;
};

export function ServiceTypeList({ serviceType, setServiceType }: ServiceTypeListProps) {
  return (
    <>
      <span className="font-medium text-dim">
        <T id="navigation.createService" />
      </span>

      <ul className="col gap-2">
        {(['web', 'private', 'worker', 'database'] as const).map((type) => (
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
