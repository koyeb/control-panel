import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';

export const Route = createFileRoute('/_main/one-clicks')({
  component: Outlet,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
