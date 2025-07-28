import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { OrganizationsPage } from 'src/pages/settings/user/organizations.page';

export const Route = createFileRoute('/_main/user/settings/organizations')({
  component: OrganizationsPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
