import { useWatch } from 'react-hook-form';

import { ControlledInput } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.defaultRole');

export function DefaultRoleSection() {
  const defaultRole = useWatch<DatabaseServiceForm, 'defaultRole'>({ name: 'defaultRole' });

  return (
    <DatabaseServiceFormSection
      section="defaultRole"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={defaultRole || <T id="defaultRoleMissing" />}
      shortcut={3}
    >
      <ControlledInput<DatabaseServiceForm, 'defaultRole'>
        name="defaultRole"
        label={<T id="defaultRoleLabel" />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}
