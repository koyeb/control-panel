import { useFormContext, useFormState } from 'react-hook-form';

import { BaseServiceFormSection } from 'src/components/base-service-form-section';

import { getServiceFormSectionIndex, sectionHasError } from '../helpers/service-form-sections';
import { ServiceForm, type ServiceFormSection } from '../service-form.types';
import { useWatchServiceForm } from '../use-service-form';

type ServiceFormSectionProps = {
  section: ServiceFormSection;
  title: React.ReactNode;
  action: React.ReactNode;
  summary: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function ServiceFormSection({ section, ...props }: ServiceFormSectionProps) {
  const expandedSection = useWatchServiceForm('meta.expandedSection');
  const expanded = section === expandedSection;

  const { setValue, watch } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();

  return (
    <BaseServiceFormSection
      expanded={expanded}
      onExpand={() => setValue('meta.expandedSection', expanded ? null : section)}
      shortcut={getShortcut(watch(), section)}
      hasError={sectionHasError(section, errors)}
      {...props}
    />
  );
}

function getShortcut(values: ServiceForm, section: ServiceFormSection) {
  const value = getServiceFormSectionIndex(values, section) + 1;

  if (value <= 10) {
    return value % 10;
  }
}
