import { createFileRoute } from '@tanstack/react-router';

import { createEnsureApiQueryData, mapVolume } from 'src/api';
import { DocumentTitle } from 'src/components/document-title';
import { createTranslate } from 'src/intl/translate';
import { VolumesListSection } from 'src/pages/volumes/volumes-list/volumes-list';

const T = createTranslate('pages.volumes');

export const Route = createFileRoute('/_main/volumes/')({
  component: function Volumes() {
    const t = T.useTranslate();

    return (
      <div className="col gap-8">
        <DocumentTitle title={t('documentTitle')} />
        <VolumesListSection />
      </div>
    );
  },

  async loader({ context: { queryClient } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    const volumes = await ensureApiQueryData('get /v1/volumes', {
      query: { offset: '0', limit: '10' },
    }).then(({ volumes }) => volumes!.map(mapVolume));

    await Promise.all(
      volumes.map(async (volume) => {
        if (volume.serviceId) {
          await ensureApiQueryData('get /v1/services/{id}', { path: { id: volume.serviceId } });
        }
      }),
    );
  },
});
