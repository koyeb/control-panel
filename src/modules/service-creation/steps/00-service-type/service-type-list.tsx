import { ServiceType } from 'src/api/model';
import { Link } from 'src/components/link';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { TranslateEnum, createTranslate } from 'src/intl/translate';

import { ServiceTypeItem } from './components/service-type-item';

const T = createTranslate('modules.serviceCreation.serviceType');

export type ExtendedServiceType = ServiceType | 'private' | 'model';

export function ServiceTypeList({ serviceType }: { serviceType: ExtendedServiceType }) {
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
          <li key={type}>
            <Link
              to="/services/new"
              search={(prev) => ({ ...prev, service_type: type })}
              data-status={type === serviceType ? 'active' : undefined}
              className="group"
            >
              <ServiceTypeItem
                icon={<ServiceTypeIcon type={type} />}
                label={<TranslateEnum enum="serviceType" value={type} />}
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
