import { Link } from '@tanstack/react-router';

import { ServiceType } from 'src/api/model';
import { ServiceTypeIcon } from 'src/components/service-type-icon';
import { useFeatureFlag } from 'src/hooks/feature-flag';
import { Translate, createTranslate } from 'src/intl/translate';

import { ServiceTypeItem } from './service-type-item';

const T = createTranslate('modules.serviceCreation.serviceType');

export type ExtendedServiceType = ServiceType | 'private' | 'model';

export function ServiceTypeList() {
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
        {serviceTypes.map((serviceType) => (
          <li key={serviceType}>
            <Link
              from="/services/new"
              search={(prev) => ({ ...prev, service_type: serviceType })}
              className="group"
            >
              <ServiceTypeItem
                icon={<ServiceTypeIcon type={serviceType} />}
                label={<Translate id={`common.serviceType.${serviceType}`} />}
              />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
