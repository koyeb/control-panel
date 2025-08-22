import { parseBytes } from 'src/application/memory';
import { requiredDeep, snakeToCamelDeep } from 'src/utils/object';
import { lowerCase } from 'src/utils/strings';

import type { API } from '../api';
import {
  CatalogDatacenter,
  CatalogInstance,
  CatalogRegion,
  CatalogUsage,
  InstanceCategory,
  RegionScope,
} from '../model';

export function mapCatalogRegion(region: API.Region): CatalogRegion {
  return {
    ...snakeToCamelDeep(requiredDeep(region)),
    status: lowerCase(region.status as 'AVAILABLE' | 'COMING_SOON'),
    scope: region.scope as RegionScope,
  };
}

export function mapCatalogDatacenter(datacenter: API.DatacenterListItem): CatalogDatacenter {
  return snakeToCamelDeep(requiredDeep(datacenter));
}

export function mapCatalogInstance(instance: API.CatalogInstance): CatalogInstance {
  return {
    ...snakeToCamelDeep(requiredDeep(instance)),
    status: lowerCase(instance.status as 'AVAILABLE' | 'COMING_SOON' | 'RESTRICTED'),
    plans: instance.require_plan!.length > 0 ? instance.require_plan! : undefined,
    regions: instance.regions!.length > 0 ? instance.regions! : undefined,
    category: instance.type! as InstanceCategory,
    regionCategory: instance.id?.startsWith('aws-') ? 'aws' : 'koyeb',
    vram: instance.gpu?.memory ? parseBytes(instance.gpu.memory) : undefined,
    priceMonthly: Number(instance.price_monthly!),
    priceHourly: Number(instance.price_hourly!),
    pricePerSecond: Number(instance.price_per_second!),
  };
}

export function mapCatalogUsage(usage: API.CatalogUsage): CatalogUsage {
  return new Map(
    Object.entries(usage.instances!).map(([instanceId, usage]) => [
      instanceId,
      {
        availability: lowerCase(usage.availability!),
        byRegion: new Map(
          Object.entries(usage.regions!).map(([regionId, usage]) => [
            regionId,
            lowerCase(usage.availability!),
          ]),
        ),
      },
    ]),
  );
}
