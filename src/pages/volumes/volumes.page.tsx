import { useQuery } from '@tanstack/react-query';

import { useVolumesQuery } from 'src/api/hooks/volume';
import { mapSnapshot } from 'src/api/mappers/volume';
import { useApiQueryFn } from 'src/api/use-api';
import { DocumentTitle } from 'src/components/document-title';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';

import { SnapshotsListSection } from './snapshots-list/snapshots-list';
import { VolumesListSection } from './volumes-list/volumes-list';

const T = createTranslate('pages.volumes');

export function VolumesPage() {
  const t = T.useTranslate();

  const volumesQuery = useVolumesQuery();

  const snapshotsQuery = useQuery({
    ...useApiQueryFn('listSnapshots', {
      query: { limit: '100' },
    }),
    select: ({ snapshots }) => snapshots!.map(mapSnapshot),
  });

  if (volumesQuery.isPending || snapshotsQuery.isPending) {
    return <Loading />;
  }

  if (volumesQuery.isError) {
    return <QueryError error={volumesQuery.error} />;
  }

  if (snapshotsQuery.isError) {
    return <QueryError error={snapshotsQuery.error} />;
  }

  return (
    <div className="col gap-8">
      <DocumentTitle title={t('documentTitle')} />
      <VolumesListSection volumes={volumesQuery.data} />
      <SnapshotsListSection snapshots={snapshotsQuery.data} />
    </div>
  );
}
