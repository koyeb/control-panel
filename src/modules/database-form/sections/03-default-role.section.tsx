import { useWatch } from 'react-hook-form';

import { ControlledInput } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.defaultRole');

export function DefaultRoleSection() {
  const defaultRole = useWatch<DatabaseServiceForm, 'defaultRole'>({ name: 'defaultRole' });

  return (
    <DatabaseServiceFormSection
      section="defaultRole"
      title={defaultRole || <T id="defaultRoleMissing" />}
      expandedTitle={<T id="expandedTitle" />}
      shortcut={3}
      description={<T id="description" />}
    >
      <ControlledInput<DatabaseServiceForm, 'defaultRole'>
        name="defaultRole"
        label={<T id="defaultRoleLabel" />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}
