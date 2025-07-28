import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { UserSettingsLayout } from 'src/pages/settings/user/user-settings.layout';

export const Route = createFileRoute('/_main/user/settings')({
  component: () => (
    <UserSettingsLayout>
      <Outlet />
    </UserSettingsLayout>
  ),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
