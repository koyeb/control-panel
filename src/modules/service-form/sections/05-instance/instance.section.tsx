import { useFormContext } from 'react-hook-form';

import { Badge } from '@koyeb/design-system';
import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { createTranslate, Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';

import { InstanceSelector } from './instance';

const T = createTranslate('modules.serviceForm.instance');

export function InstanceSection() {
  return (
    <ServiceFormSection
      section="instance"
      title={<SectionTitle />}
      description={<T id="description" />}
      expandedTitle={<T id="expandedTitle" />}
      className="col gap-6 pb-0"
    >
      <InstanceSelector />
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const instance = useInstance(useFormContext<ServiceForm>().watch('instance'));
  const regions = useRegions(useFormContext<ServiceForm>().watch('regions'));

  if (!instance) {
    return <T id="noInstanceSelected" />;
  }

  const spec = (
    <Translate
      id="common.instanceSpec"
      values={{ cpu: instance.cpu, ram: instance.ram, disk: instance.disk }}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-normal">
      <span className="font-medium">{instance.displayName}</span>

      <span>
        <T id="instanceSpec" values={{ spec }} />
      </span>

      <Badge color="green" size={1}>
        <T id={`category.${instance.category}`} />
      </Badge>

      {regions.length === 1 && (
        <span className="inline-flex flex-row items-center gap-2">
          <RegionName identifier={regions[0]!.identifier} />
          <RegionFlag identifier={regions[0]!.identifier} className="size-em" />
        </span>
      )}

      {regions.length > 1 && (
        <span>
          {regions.map((region, index) => (
            <RegionFlag
              key={region.identifier}
              identifier={region.identifier}
              className="inline-block size-em"
              style={{ marginLeft: `-${index / 2}rem` }}
            />
          ))}

          <span className="ml-1">{regions.length} regions</span>
        </span>
      )}
    </div>
  );
}
