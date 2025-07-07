import { createFileRoute } from '@tanstack/react-router';

import { Crumb } from 'src/layouts/main/app-breadcrumbs';
import { VolumeSnapshotsPage } from 'src/pages/volumes/volume-snapshots/volume-snapshots.page';

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: VolumeSnapshotsPage,

  beforeLoad: () => ({
    breadcrumb: () => <Crumb to={Route.fullPath} />,
  }),
});
