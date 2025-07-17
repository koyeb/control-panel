import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import { BaseServiceFormSection } from 'src/components/base-service-form-section';

import { DatabaseServiceForm, type DatabaseServiceFormSection } from '../database-service-form.types';

type DatabaseServiceFormSectionProps = {
  section: DatabaseServiceFormSection;
  title: React.ReactNode;
  action: React.ReactNode;
  summary: React.ReactNode;
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
      onExpand={() => setValue('meta.expandedSection', expanded ? null : section)}
      hasError={errors[section] !== undefined}
      {...props}
    />
  );
}
