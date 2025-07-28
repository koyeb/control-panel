import { Outlet, createFileRoute } from '@tanstack/react-router';

import { OrganizationSettingsLayout } from 'src/pages/settings/organization/organization-settings.layout';

export const Route = createFileRoute('/_main/settings')({
  component: () => (
    <OrganizationSettingsLayout>
      <Outlet />
    </OrganizationSettingsLayout>
  ),
});
