import { Outlet, createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { VolumesLayout } from 'src/pages/volumes/volumes-layout';

export const Route = createFileRoute('/_main/volumes')({
  component: () => (
    <VolumesLayout>
      <Outlet />
    </VolumesLayout>
  ),

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
