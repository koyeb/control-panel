import { createFileRoute } from '@tanstack/react-router';
import { getBreadcrumb } from 'src/layouts/main/app-breadcrumbs';
import { VolumeSnapshotsPage } from 'src/pages/volumes/volume-snapshots/volume-snapshots.page';

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: VolumeSnapshotsPage,

  loader: ({ context, location }) => {
    context.breadcrumb = getBreadcrumb(location, 'volumeSnapshots');
  },
});
