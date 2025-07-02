import { Outlet, createFileRoute } from '@tanstack/react-router';

import { VolumesLayout } from 'src/pages/volumes/volumes-layout';

export const Route = createFileRoute('/_main/volumes')({
  component: () => (
    <VolumesLayout>
      <Outlet />
    </VolumesLayout>
  ),
});
