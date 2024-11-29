import { parseBytes } from 'src/application/memory';
import { lowerCase } from 'src/utils/strings';

import { ApiEndpointResult } from '../api';
import type { Api } from '../api-types';
import {
  CatalogDatacenter,
  CatalogInstance,
  CatalogInstanceStatus,
  CatalogRegion,
  InstanceCategory,
} from '../model';

export function mapCatalogRegionsList({ regions }: ApiEndpointResult<'listCatalogRegions'>): CatalogRegion[] {
  return regions!.map((region) => ({
    identifier: region.id!,
    displayName: region.name!,
    status: lowerCase(region.status!) as CatalogRegion['status'],
    datacenters: region.datacenters!,
    instances: region.instances,
    hasVolumes: region.volumes_enabled!,
    category: region.id!.startsWith('aws-') ? 'aws' : 'koyeb',
  }));
}

export function mapCatalogDatacentersList({
  datacenters,
}: ApiEndpointResult<'listCatalogDatacenters'>): CatalogDatacenter[] {
  return datacenters!.map((datacenter) => ({
    identifier: datacenter.id!,
    regionIdentifier: datacenter.region_id!,
    domain: datacenter.domain!,
  }));
}

export function mapCatalogInstancesList({
  instances,
}: ApiEndpointResult<'listCatalogInstances'>): CatalogInstance[] {
  return instances!.map(mapCatalogInstance).sort((a, b) => (a.vram ?? 0) - (b.vram ?? 0));
}

export function mapCatalogInstance(instance: Api.CatalogInstance): CatalogInstance {
  return {
    identifier: instance.id!,
    displayName: instance.display_name!,
    status: lowerCase(instance.status!) as CatalogInstanceStatus,
    plans: instance.require_plan!.length > 0 ? instance.require_plan! : undefined,
    regions: instance.regions!.length > 0 ? instance.regions! : undefined,
    category: instance.type! as InstanceCategory,
    regionCategory: instance.id?.startsWith('aws-') ? 'aws' : 'koyeb',
    cpu: instance.vcpu_shares!,
    ram: instance.memory!,
    vram: instance.gpu?.memory ? parseBytes(instance.gpu?.memory) : undefined,
    disk: instance.disk!,
    hasVolumes: instance.volumes_enabled!,
    pricePerMonth: Number(instance.price_monthly!),
    pricePerHour: Number(instance.price_hourly!),
    pricePerSecond: Number(instance.price_per_second!),
  };
}
