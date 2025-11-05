import { TooltipTitle } from '@koyeb/design-system';
import { capitalize } from 'lodash-es';

import { useCatalogInstance } from 'src/api';
import { formatBytes } from 'src/application/memory';
import { SvgComponent } from 'src/application/types';
import { Metadata } from 'src/components/metadata';
import { Tooltip } from 'src/components/tooltip';
import { IconCpu, IconMemoryStick, IconMicrochip, IconRadioReceiver } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CatalogInstance } from 'src/model';

const T = createTranslate('modules.deployment.metadata.instance');

type InstanceMetadataProps = {
  instance?: string | null;
};

export function InstanceMetadata(props: InstanceMetadataProps) {
  return <Metadata label={<T id="label" />} value={<InstanceMetadataValue {...props} />} />;
}

export function InstanceMetadataValue({ instance: instanceId }: InstanceMetadataProps) {
  const instance = useCatalogInstance(instanceId);

  return (
    <Tooltip
      className="md:min-w-42"
      content={instance && <InstanceTooltipContent instance={instance} />}
      trigger={(props) => (
        <div {...props} className="row items-center gap-2">
          <div>
            <IconCpu strokeWidth={1} className="size-4" />
          </div>
          <div className="truncate">{instance?.displayName}</div>
        </div>
      )}
    />
  );
}

function InstanceTooltipContent({ instance }: { instance: CatalogInstance }) {
  return (
    <div className="col gap-3">
      <TooltipTitle title={<T id="tooltip.title" values={{ category: capitalize(instance.category) }} />} />

      <div className="font-bold">{instance.displayName}</div>

      <InstanceSpecValue
        Icon={IconCpu}
        value={<T id="tooltip.cpu" values={{ value: instance.vcpuShares }} />}
      />

      <InstanceSpecValue
        Icon={IconMemoryStick}
        value={<T id="tooltip.ram" values={{ value: instance.memory }} />}
      />

      {instance.vram !== undefined && (
        <InstanceSpecValue
          Icon={IconMicrochip}
          value={
            <T
              id="tooltip.vram"
              values={{ value: formatBytes(instance.vram, { round: true, decimal: true }) }}
            />
          }
        />
      )}

      <InstanceSpecValue
        Icon={IconRadioReceiver}
        value={<T id="tooltip.disk" values={{ value: instance.disk }} />}
      />
    </div>
  );
}

function InstanceSpecValue({ Icon, value }: { Icon: SvgComponent; value: React.ReactNode }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <Icon strokeWidth={1} className="size-4" />
      </div>
      {value}
    </div>
  );
}
