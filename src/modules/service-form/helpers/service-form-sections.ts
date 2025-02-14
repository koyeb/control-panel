import posthog from 'posthog-js';
import { FieldErrors } from 'react-hook-form';

import { ServiceForm, ServiceFormSection } from '../service-form.types';

export function getServiceFormSections(form: ServiceForm) {
  const hasNewInstanceSelector = posthog.isFeatureEnabled('new-instance-selector');

  const sections: Array<ServiceFormSection | false> = [
    'serviceType',
    'source',
    (form.source.type === 'archive' || form.source.type === 'git') && 'builder',
    form.source.type === 'docker' && 'deployment',
    'environmentVariables',
    'instance',
    !hasNewInstanceSelector && 'regions',
    'scaling',
    'volumes',
    form.serviceType === 'web' && 'ports',
    form.serviceType === 'web' && 'healthChecks',
    'serviceName',
  ];

  return sections.filter((section): section is ServiceFormSection => section !== false);
}

export function getServiceFormSectionIndex(form: ServiceForm, section: ServiceFormSection) {
  return getServiceFormSections(form).indexOf(section);
}

export function sectionHasError(section: ServiceFormSection, errors: FieldErrors<ServiceForm>) {
  switch (section) {
    case 'serviceName':
      return errors.appName !== undefined || errors.serviceName !== undefined;

    case 'serviceType':
      return errors.serviceType !== undefined;

    case 'source':
      return errors.source !== undefined;

    case 'builder':
      return errors.builder !== undefined;

    case 'deployment':
      return errors.dockerDeployment !== undefined;

    case 'environmentVariables':
      return errors.environmentVariables !== undefined || errors.files !== undefined;

    case 'regions':
      return errors.regions !== undefined;

    case 'instance':
      return errors.instance !== undefined;

    case 'scaling':
      return errors.scaling !== undefined;

    case 'volumes':
      return errors.volumes !== undefined;

    case 'ports':
      return errors.ports?.some?.((port) => {
        return !(Object.keys(port ?? {}).length === 1 && port?.healthCheck);
      });

    case 'healthChecks':
      return errors.ports?.some?.((port) => port?.healthCheck !== undefined);
  }
}
