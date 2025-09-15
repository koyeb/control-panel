import { useVolumesQuery } from 'src/api/hooks/volume';
import { DocumentTitle } from 'src/components/document-title';
import { LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { createTranslate } from 'src/intl/translate';

import { VolumesList } from './volumes-list';

const T = createTranslate('pages.volumes.list');

export function VolumesListPage() {
  const t = T.useTranslate();

  const volumesQuery = useVolumesQuery();

  if (volumesQuery.isPending) {
    return <Loading />;
  }

  if (volumesQuery.isError) {
    return <QueryError error={volumesQuery.error} />;
  }

  const volumes = volumesQuery.data;

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Title
        title={<T id="header.title" />}
        end={
          volumes.length > 0 && (
            <LinkButton to="/volumes/new">
              <T id="header.createVolume" />
            </LinkButton>
          )
        }
      />

      <VolumesList volumes={volumes} />
    </div>
  );
}
