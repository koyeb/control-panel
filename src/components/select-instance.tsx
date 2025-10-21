import { useCatalogInstance, useCatalogRegion } from 'src/api';
import { Instance } from 'src/model';
import { getId, getName } from 'src/utils/object';

import { Select } from './forms/select';

type SelectInstanceOwnProps = {
  instances: Instance[];
  value: Instance | null;
  onChange: (instance: Instance) => void;
  unselect?: React.ReactNode;
  onUnselect?: () => void;
};

type SelectInstanceProps = SelectInstanceOwnProps &
  Omit<
    React.ComponentProps<typeof Select<Instance>>,
    'items' | 'selectedItem' | 'onSelectedItemChange' | 'getKey' | 'itemToString' | 'renderItem'
  >;

export function SelectInstance({ instances, unselect, onUnselect, ...props }: SelectInstanceProps) {
  return (
    <Select
      items={instances}
      onItemClick={(instance) => instance === props.value && onUnselect?.()}
      getKey={getId}
      itemToString={getName}
      renderItem={(instance) => <InstanceItem instance={instance} />}
      {...props}
    />
  );
}

function InstanceItem({ instance }: { instance: Instance }) {
  const region = useCatalogRegion(instance.region);
  const instanceType = useCatalogInstance(instance.type);

  return (
    <div className="row items-center gap-4">
      {instance.name}
      <div className="ml-auto row items-center gap-2 text-xs">
        {instanceType?.displayName} - {region?.name}
      </div>
    </div>
  );
}
