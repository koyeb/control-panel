import { CatalogInstance } from 'src/api/model';

// prettier-ignore
export const databaseInstances = Object.freeze([
  createDatabaseInstanceType('free',    'Free',     [0.25,   1,    1],      0,      0,        0),
  createDatabaseInstanceType('small',   'Small',    [0.25,   1, null],  20.89, 0.0288, 0.000008),
  createDatabaseInstanceType('medium',  'Medium',   [ 0.5,   2, null],  42.85, 0.0576, 0.000016),
  createDatabaseInstanceType('large',   'Large',    [   1,   4, null],  96.42, 0.1296, 0.000036),
])

function createDatabaseInstanceType(
  catalogInstanceId: string,
  displayName: string,
  [vcpuShares, memory, disk]: [cpu: number, ram: number, disk: number | null],
  priceMonthly: number,
  priceHourly: number,
  pricePerSecond: number,
): CatalogInstance {
  return {
    id: catalogInstanceId,
    status: 'available',
    category: 'standard',
    regionCategory: 'koyeb',
    displayName,
    vcpuShares,
    memory: memory + ' GB',
    disk: disk === null ? '∞' : disk + ' GB',
    priceMonthly,
    priceHourly,
    pricePerSecond,
    plans:
      catalogInstanceId !== 'free'
        ? ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise', 'internal']
        : undefined,
    volumesEnabled: false,
  };
}
