import { CatalogInstance } from 'src/api/model';

// prettier-ignore
export const databaseInstances = Object.freeze([
  createDatabaseInstanceType('free',    'Free',     [0.25,   1,    1],      0, 0),
  createDatabaseInstanceType('small',   'Small',    [0.25,   1, null],  20.89, 0.000008),
  createDatabaseInstanceType('medium',  'Medium',   [ 0.5,   2, null],  42.85, 0.000016),
  createDatabaseInstanceType('large',   'Large',    [   1,   4, null],  96.42, 0.000036),
  // createDatabaseInstanceType('xlarge',  'XLarge',   [   2,   8, null],    195, 0),
  // createDatabaseInstanceType('xxlarge', 'XXLarge',  [   3,  12, null],    395, 0),
  // createDatabaseInstanceType('3xlarge', '3XLarge',  [   4,  16, null],    495, 0),
  // createDatabaseInstanceType('4xlarge', '4XLarge',  [   5,  20, null],    595, 0),
  // createDatabaseInstanceType('5xlarge', '5XLarge',  [   6,  24, null],    695, 0),
  // createDatabaseInstanceType('6xlarge', '6XLarge',  [   7,  28, null],    795, 0),
])

function createDatabaseInstanceType(
  identifier: string,
  displayName: string,
  [cpu, ram, disk]: [cpu: number, ram: number, disk: number | null],
  pricePerMonth: number,
  pricePerSecond: number,
): CatalogInstance {
  return {
    identifier,
    status: 'available',
    category: 'standard',
    regionCategory: 'koyeb',
    displayName,
    cpu,
    ram: ram + ' GB',
    disk: disk === null ? '∞' : disk + ' GB',
    pricePerMonth,
    pricePerSecond,
    plans: identifier !== 'free' ? ['starter', 'startup', 'enterprise', 'internal'] : undefined,
    hasVolumes: false,
  };
}
