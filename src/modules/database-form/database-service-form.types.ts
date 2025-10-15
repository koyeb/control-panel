import { PostgresVersion } from 'src/model';

export type DatabaseServiceFormSection = 'engine' | 'region' | 'instance' | 'defaultRole' | 'serviceName';

export type DatabaseServiceForm = {
  meta: ServiceFormMeta;
  engine: { version: PostgresVersion };
  region: string;
  instance: string;
  defaultRole: string;
  serviceName: string;
};

type ServiceFormMeta = {
  appId: string | null;
  databaseServiceId: string | null;
  expandedSection: DatabaseServiceFormSection | null;
  allowFreeInstanceIfAlreadyUsed: boolean;
};
