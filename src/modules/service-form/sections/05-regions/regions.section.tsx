import { useRegion, useRegions } from 'src/api/hooks/catalog';
import { RegionFlag } from 'src/components/region-flag';
import { RegionLatency } from 'src/components/region-latency';
import { RegionsMap } from 'src/components/regions-map/regions-map';
import { useRegionLatency } from 'src/hooks/region-latency';
import { Translate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { useWatchServiceForm } from '../../use-service-form';

import { RegionItem } from './region-item';
import { RegionsAlerts } from './regions-alerts';
import { RegionsList } from './regions-list';

const T = Translate.prefix('serviceForm.regions');

export function RegionsSection() {
  const regions = useRegions();

  return (
    <ServiceFormSection
      section="regions"
      title={<SectionTitle />}
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
      className="col gap-6"
    >
      <RegionsAlerts />

      <div className="hidden xl:block">
        <RegionsMap
          regions={regions}
          renderRegion={(region) => (
            <RegionItem
              region={region}
              classes={{
                content: 'col gap-1 rounded-r-lg p-2',
                title: '!p-0',
                description: '!p-0',
              }}
            />
          )}
        />
      </div>

      <div className="xl:hidden">
        <RegionsList />
      </div>
    </ServiceFormSection>
  );
}

function SectionTitle() {
  const selectedRegions = useWatchServiceForm('regions');
  const firstRegion = useRegion(selectedRegions[0] as string);
  const plus = selectedRegions.length - 1;
  const latency = useRegionLatency(firstRegion);

  if (!firstRegion) {
    return <T id="noRegions" />;
  }

  return (
    <div className="row items-center gap-1">
      <RegionFlag identifier={firstRegion.identifier} className="me-1 size-5" />

      <div>{firstRegion.displayName}</div>

      {latency && (
        <div className="font-normal text-dim">
          (<RegionLatency isAvailable region={firstRegion} />)
        </div>
      )}

      {plus > 0 && (
        <div className="font-normal">
          <T id="plus" values={{ count: plus }} />
        </div>
      )}
    </div>
  );
}
