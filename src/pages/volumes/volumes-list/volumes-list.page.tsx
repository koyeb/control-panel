import { useState } from 'react';

import { Button } from '@koyeb/design-system';
import { useVolumesQuery } from 'src/api/hooks/volume';
import { DocumentTitle } from 'src/components/document-title';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { Title } from 'src/components/title';
import { Translate } from 'src/intl/translate';

import { CreateVolumeDialog } from './create-volume-dialog';
import { VolumesList } from './volumes-list';

const T = Translate.prefix('pages.volumes');

export function VolumesListPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
            <Button onClick={() => setCreateDialogOpen(true)}>
              <T id="header.createVolume" />
            </Button>
          )
        }
      />

      <VolumesList volumes={volumes} onCreate={() => setCreateDialogOpen(true)} />
      <CreateVolumeDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />
    </div>
  );
}
