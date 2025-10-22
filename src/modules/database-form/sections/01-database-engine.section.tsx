import { useWatch } from 'react-hook-form';

import { ControlledSelect } from 'src/components/forms';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.engine');

export function DatabaseEngineSection() {
  return (
    <DatabaseServiceFormSection
      section="engine"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<Summary />}
      shortcut={1}
    >
      <ControlledSelect<DatabaseServiceForm, 'engine.version'>
        name="engine.version"
        label={<T id="engineLabel" />}
        items={[14, 15, 16, 17, 18]}
        getKey={identity}
        itemToValue={identity}
        itemToString={String}
        renderItem={(version) => <T id="engineItem" values={{ version }} />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}

function Summary() {
  const version = useWatch<DatabaseServiceForm, 'engine.version'>({ name: 'engine.version' });

  return (
    <div className="row gap-1">
      <T id="summary" values={{ version }} />
    </div>
  );
}
