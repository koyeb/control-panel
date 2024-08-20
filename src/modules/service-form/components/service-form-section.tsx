import { useFormContext, useFormState } from 'react-hook-form';

import { BaseServiceFormSection } from 'src/components/base-service-form-section';
import { useFeatureFlag } from 'src/hooks/feature-flag';

import { getServiceFormSectionIndex, sectionHasError } from '../helpers/service-form-sections';
import { ServiceForm, type ServiceFormSection } from '../service-form.types';
import { useWatchServiceForm } from '../use-service-form';

type ServiceFormSectionProps = {
  section: ServiceFormSection;
  title: React.ReactNode;
  expandedTitle: React.ReactNode;
  description: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function ServiceFormSection({ section, ...props }: ServiceFormSectionProps) {
  const expandedSection = useWatchServiceForm('meta.expandedSection');
  const expanded = section === expandedSection;

  const { setValue, watch } = useFormContext<ServiceForm>();
  const { errors } = useFormState<ServiceForm>();

  const showVolumes = useFeatureFlag('volumes');

  return (
    <BaseServiceFormSection
      expanded={expanded}
      expand={() => setValue('meta.expandedSection', expanded ? null : section)}
      shortcut={getShortcut(watch(), section, showVolumes)}
      hasError={sectionHasError(section, errors)}
      {...props}
    />
  );
}

function getShortcut(values: ServiceForm, section: ServiceFormSection, showVolumes: boolean) {
  const value = getServiceFormSectionIndex(values, section, showVolumes) + 1;

  if (value <= 10) {
    return value % 10;
  }
}
