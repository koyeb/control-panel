import { useWatch, useFormContext, useFormState } from 'react-hook-form';

import { BaseServiceFormSection } from 'src/components/base-service-form-section';

import { type DatabaseServiceFormSection, DatabaseServiceForm } from '../database-service-form.types';

type DatabaseServiceFormSectionProps = {
  section: DatabaseServiceFormSection;
  title: React.ReactNode;
  expandedTitle: React.ReactNode;
  description: React.ReactNode;
  shortcut: number;
  className?: string;
  children: React.ReactNode;
};

export function DatabaseServiceFormSection({ section, ...props }: DatabaseServiceFormSectionProps) {
  const expandedSection = useWatch<DatabaseServiceForm>({ name: 'meta.expandedSection' });
  const expanded = section === expandedSection;

  const { setValue } = useFormContext<DatabaseServiceForm>();
  const { errors } = useFormState<DatabaseServiceForm>();

  return (
    <BaseServiceFormSection
      expanded={expanded}
      expand={() => setValue('meta.expandedSection', expanded ? null : section)}
      hasError={errors[section] !== undefined}
      {...props}
    />
  );
}
