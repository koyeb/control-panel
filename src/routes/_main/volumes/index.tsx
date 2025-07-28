import { createFileRoute } from '@tanstack/react-router';

import { VolumesPage } from 'src/pages/volumes/volumes.page';

export const Route = createFileRoute('/_main/volumes/')({
  component: VolumesPage,
});
