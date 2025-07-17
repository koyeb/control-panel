import { Badge } from '@koyeb/design-system';
import { useFormContext } from 'react-hook-form';

import { useInstance, useRegions } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { RegionName } from 'src/components/region-name';
import { Translate, createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { ServiceForm } from '../../service-form.types';

import { InstanceSelector } from './instance';

const T = createTranslate('modules.serviceForm.instance');

export function InstanceSection() {
  return (
    <ServiceFormSection
      section="instance"
      title={<T id="title" />}
      action={<T id="action" />}
      summary={<SectionTitle />}
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
      values={{ cpu: instance.vcpuShares, ram: instance.memory, disk: instance.disk }}
    />
  );

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-normal">
      <span className="font-medium">{instance.displayName}</span>

      <span>
        <T id="instanceSpec" values={{ spec }} />
      </span>

      <Badge color="green" size={1}>
        <T id={`category.${instance.category}`} />
      </Badge>

      {regions.length === 1 && (
        <span className="inline-flex flex-row items-center gap-2">
          <RegionName regionId={regions[0]!.id} />
          <RegionFlag regionId={regions[0]!.id} className="size-em" />
        </span>
      )}

      {regions.length > 1 && (
        <span className="inline-flex flex-row items-center gap-2">
          <span className="inline-flex flex-row" style={{ width: `${regions.length / 2}em` }}>
            {regions.map((region, index) => (
              <RegionFlag
                key={region.id}
                regionId={region.id}
                className="inline-block size-em"
                style={{ transform: `translateX(-${index / 2}em)` }}
              />
            ))}
          </span>

          <span className="ml-1">{regions.length} regions</span>
        </span>
      )}
    </div>
  );
}
