import { createFileRoute } from '@tanstack/react-router';

import { VolumesListPage } from 'src/pages/volumes/volumes-list/volumes-list.page';

export const Route = createFileRoute('/_main/volumes/')({
  component: VolumesListPage,
});
