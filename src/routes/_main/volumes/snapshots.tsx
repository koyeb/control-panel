import { createFileRoute } from '@tanstack/react-router';

import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { VolumeSnapshotsPage } from 'src/pages/volumes/volume-snapshots/volume-snapshots.page';

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: VolumeSnapshotsPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),
});
