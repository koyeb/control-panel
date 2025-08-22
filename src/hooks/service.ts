import { useApp } from 'src/api/hooks/app';
import { useService } from 'src/api/hooks/service';
import { useTranslate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

export function useServiceName(serviceId: string): string | null {
  const service = useService(serviceId);
  const app = useApp(service?.appId);

  const t = useTranslate();

  if (app === undefined || service === undefined) {
    return null;
  }

  const name = t('common.appServiceName', {
    appName: app.name,
    serviceName: service.name,
  });

  assert(typeof name === 'string');

  return name;
}
