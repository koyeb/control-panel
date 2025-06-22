import { createFileRoute, Outlet } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { VolumesLayout } from 'src/pages/volumes/volumes-layout';

export const Route = createFileRoute('/_main/volumes')({
  component: () => (
    <VolumesLayout>
      <Outlet />
    </VolumesLayout>
  ),

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'volumes');
  },
});
