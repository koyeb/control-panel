import { useWatch } from 'react-hook-form';

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

  return (
    <DatabaseServiceFormSection
      section="instance"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      shortcut={serviceId ? 1 : 2}
      description={<T id="description" />}
      className="pb-0"
    >
      <DatabaseInstanceSelector allowFreeInstanceIfAlreadyUsed={allowFreeInstanceIfAlreadyUsed} />
    </DatabaseServiceFormSection>
  );
}

function SectionTitle() {
  const catalogInstanceId = useWatch<DatabaseServiceForm, 'instance'>({ name: 'instance' });
  const instance = databaseInstances.find(hasProperty('id', catalogInstanceId));

  if (instance === undefined) {
    return null;
  }

  const spec = (
    <Translate
      id="common.instanceSpec"
      values={{ cpu: instance.vcpuShares, ram: instance.memory, disk: instance.disk }}
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
