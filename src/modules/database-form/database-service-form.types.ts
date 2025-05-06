export type DatabaseServiceFormSection = 'engine' | 'region' | 'instance' | 'defaultRole' | 'serviceName';

export type DatabaseServiceForm = {
  meta: ServiceFormMeta;
  engine: { version: 14 | 15 | 16 | 17 };
  region: string;
  instance: string;
  defaultRole: string;
  serviceName: string;
};

type ServiceFormMeta = {
  databaseServiceId: string | null;
  expandedSection: DatabaseServiceFormSection | null;
  allowFreeInstanceIfAlreadyUsed: boolean;
};
