import { createFileRoute } from '@tanstack/react-router';

import { createEnsureApiQueryData, mapSnapshot } from 'src/api';
import { DocumentTitle } from 'src/components/document-title';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { SnapshotsListSection } from 'src/pages/volumes/snapshots-list/snapshots-list';

const T = createTranslate('pages.volumes');

export const Route = createFileRoute('/_main/volumes/snapshots')({
  component: function Snapshots() {
    const t = T.useTranslate();

    return (
      <div className="col gap-8">
        <DocumentTitle title={t('documentTitle')} />
        <SnapshotsListSection />
      </div>
    );
  },

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.fullPath} />,
  }),

  async loader({ context: { queryClient } }) {
    const ensureApiQueryData = createEnsureApiQueryData(queryClient);

    const snapshots = await ensureApiQueryData('get /v1/snapshots', {
      query: { offset: '0', limit: '10' },
    }).then(({ snapshots }) => snapshots!.map(mapSnapshot));

    await Promise.all(
      snapshots.map(async (snapshot) => {
        if (snapshot.volumeId) {
          await ensureApiQueryData('get /v1/volumes/{id}', { path: { id: snapshot.volumeId } }).catch(
            () => {},
          );
        }
      }),
    );
  },
});
