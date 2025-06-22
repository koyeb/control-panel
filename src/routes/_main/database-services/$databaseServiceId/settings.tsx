import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { DatabaseSettingsPage } from 'src/pages/databases/database/settings/database-settings.page';

export const Route = createFileRoute('/_main/database-services/$databaseServiceId/settings')({
  component: DatabaseSettingsPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'service.settings');
  },
});
