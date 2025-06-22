import { createFileRoute } from '@tanstack/react-router';
import { VolumeSnapshotsPage } from 'src/pages/volumes/volume-snapshots/volume-snapshots.page';

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: VolumeSnapshotsPage,
});
