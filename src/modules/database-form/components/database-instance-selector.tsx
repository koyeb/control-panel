import { useOrganizationSummary } from 'src/api/hooks/session';
import { InstanceSelectorList } from 'src/components/instance-selector';
import { hasProperty } from 'src/utils/object';

import { databaseInstances } from '../database-instance-types';

type DatabaseInstanceSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  allowFreeInstanceIfAlreadyUsed?: boolean;
};

export function DatabaseInstanceSelector({
  value,
  onChange,
  allowFreeInstanceIfAlreadyUsed,
}: DatabaseInstanceSelectorProps) {
  const instance = databaseInstances.find(hasProperty('identifier', value));
  const summary = useOrganizationSummary();

  return (
    <InstanceSelectorList
      instances={databaseInstances}
      checkAvailability={(instance) => {
        if (instance === 'free' && summary?.freeDatabaseUsed && !allowFreeInstanceIfAlreadyUsed) {
          return [false, 'freeAlreadyUsed'];
        }

        return [true];
      }}
      selectedInstance={instance ?? null}
      onInstanceSelected={(instance) => onChange(instance.identifier)}
    />
  );
}
