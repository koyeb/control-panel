import { CatalogRegion } from 'src/api/model';
import { useRegionLatency } from 'src/hooks/region-latency';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('regionLatency');

type RegionLatencyProps = {
  region: CatalogRegion;
};

export function RegionLatency({ region }: RegionLatencyProps) {
  const latency = useRegionLatency(region);

  if (latency === null) {
    return null;
  }

  if (latency === undefined) {
    return <T id="checkingLatency" />;
  }

  return <T id="latency" values={{ ms: latency }} />;
}
