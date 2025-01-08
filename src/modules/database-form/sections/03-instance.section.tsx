import { useController, useWatch } from 'react-hook-form';

import { createTranslate, Translate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { DatabaseInstanceSelector } from '../components/database-instance-selector';
import { DatabaseServiceFormSection } from '../components/database-service-form-section';
import { databaseInstances } from '../database-instance-types';
import { DatabaseServiceForm } from '../database-service-form.types';

const T = createTranslate('modules.databaseForm.instance');

export function InstanceSection() {
  const serviceId = useWatch<DatabaseServiceForm, 'meta.databaseServiceId'>({
    name: 'meta.databaseServiceId',
  });

  const allowFreeInstanceIfAlreadyUsed = useWatch<DatabaseServiceForm, 'meta.allowFreeInstanceIfAlreadyUsed'>(
    { name: 'meta.allowFreeInstanceIfAlreadyUsed' },
  );

  const { field } = useController<DatabaseServiceForm, 'instance'>({ name: 'instance' });

  return (
    <DatabaseServiceFormSection
      section="instance"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      shortcut={serviceId ? 1 : 3}
      description={<T id="description" />}
    >
      <DatabaseInstanceSelector
        value={field.value}
        onChange={field.onChange}
        allowFreeInstanceIfAlreadyUsed={allowFreeInstanceIfAlreadyUsed}
      />
    </DatabaseServiceFormSection>
  );
}

function SectionTitle() {
  const instanceIdentifier = useWatch<DatabaseServiceForm, 'instance'>({ name: 'instance' });
  const instance = databaseInstances.find(hasProperty('identifier', instanceIdentifier));

  if (instance === undefined) {
    return null;
  }

  const spec = (
    <Translate
      id="common.instanceSpec"
      values={{ cpu: instance.cpu, ram: instance.ram, disk: instance.disk }}
    />
  );

  return (
    <>
      {instance.displayName}

      <span className="ml-1 inline-flex flex-row items-center gap-4 font-normal">
        <T id="instanceSpec" values={{ spec }} />
      </span>
    </>
  );
}
