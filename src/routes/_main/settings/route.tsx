import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { OrganizationSettingsLayout } from 'src/pages/settings/organization/organization-settings.layout';

export const Route = createFileRoute('/_main/settings')({
  component: () => (
    <OrganizationSettingsLayout>
      <Outlet />
    </OrganizationSettingsLayout>
  ),

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'organizationSettings.index');
  },
});
