import { useQuery } from '@tanstack/react-query';

import { mapSnapshotList } from 'src/api/mappers/volume';
import { useApiQueryFn } from 'src/api/use-api';
import { DocumentTitle } from 'src/components/document-title';
import { QueryGuard } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

import { VolumeSnapshotsList } from './volume-snapshots-list';

const T = Translate.prefix('pages.volumeSnapshots');

export function VolumeSnapshotsPage() {
  const t = T.useTranslate();

  const query = useQuery({
    ...useApiQueryFn('listSnapshots', {
      query: { limit: '100' },
    }),
    select: (data) => mapSnapshotList(data.snapshots!),
  });

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Title title={<T id="title" />} />

      <QueryGuard query={query}>{(snapshots) => <VolumeSnapshotsList snapshots={snapshots} />}</QueryGuard>
    </div>
  );
}
