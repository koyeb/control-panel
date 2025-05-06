import { CatalogInstance } from 'src/api/model';

// prettier-ignore
export const databaseInstances = Object.freeze([
  //                         id         display_name   cpu   ram   disk    price/mo  price/hr
  createDatabaseInstanceType('free',    'Free',     [ 0.25,    1,     1],         0,        0),
  createDatabaseInstanceType('small',   'Small',    [ 0.25,    1,  null],     29.76,     0.04),
  createDatabaseInstanceType('medium',  'Medium',   [  0.5,    2,  null],     59.52,     0.08),
  createDatabaseInstanceType('large',   'Large',    [    1,    4,  null],    119.04,     0.16),
  createDatabaseInstanceType('xlarge',  'XLarge',   [    2,    8,  null],    238.08,     0.32),
  createDatabaseInstanceType('2xlarge', '2XLarge',  [    4,   16,  null],    476.16,     0.64),
  createDatabaseInstanceType('3xlarge', '3XLarge',  [    8,   32,  null],    952.32,     1.28),
])

function createDatabaseInstanceType(
  catalogInstanceId: string,
  displayName: string,
  [vcpuShares, memory, disk]: [cpu: number, ram: number, disk: number | null],
  priceMonthly: number,
  priceHourly: number,
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
    pricePerSecond: priceHourly / (60 * 60),
    plans:
      catalogInstanceId !== 'free'
        ? ['starter', 'startup', 'pro', 'scale', 'business', 'enterprise', 'internal']
        : undefined,
    volumesEnabled: false,
  };
}
