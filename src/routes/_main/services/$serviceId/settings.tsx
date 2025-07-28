import { createFileRoute } from '@tanstack/react-router';

import { ServiceSettingsPage } from 'src/pages/service/settings/service-settings.page';

export const Route = createFileRoute('/_main/services/$serviceId/settings')({
  component: ServiceSettingsPage,
});
