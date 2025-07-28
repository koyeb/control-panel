import { createFileRoute } from '@tanstack/react-router';

import { DatabaseSettingsPage } from 'src/pages/databases/database/settings/database-settings.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/settings')({
  component: DatabaseSettingsPage,
});
