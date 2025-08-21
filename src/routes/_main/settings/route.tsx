import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { OrganizationSettingsLayout } from 'src/pages/settings/organization/organization-settings.layout';

export const Route = createFileRoute('/_main/settings')({
  component: () => (
    <OrganizationSettingsLayout>
      <Outlet />
    </OrganizationSettingsLayout>
  ),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
