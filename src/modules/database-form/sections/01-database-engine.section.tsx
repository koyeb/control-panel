import { useWatch } from 'react-hook-form';

import { ControlledSelect } from 'src/components/controlled';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.engine');

export function DatabaseEngineSection() {
  const version = useWatch<DatabaseServiceForm, 'engine.version'>({ name: 'engine.version' });

  return (
    <DatabaseServiceFormSection
      section="engine"
      title={
        <div className="row gap-1">
          <T id="title" />
          <span className="font-normal text-dim">
            <T id="titleVersion" values={{ version }} />
          </span>
        </div>
      }
      expandedTitle={<T id="expandedTitle" />}
      shortcut={1}
      description={<T id="description" />}
    >
      <ControlledSelect<DatabaseServiceForm, 'engine.version'>
        name="engine.version"
        label={<T id="engineLabel" />}
        items={[14, 15, 16, 17]}
        getKey={identity}
        itemToValue={identity}
        itemToString={String}
        renderItem={(version) => <T id="engineItem" values={{ version }} />}
        className="max-w-sm"
      />
    </DatabaseServiceFormSection>
  );
}
