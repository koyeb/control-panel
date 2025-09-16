import { DocumentTitle } from 'src/components/document-title';
import { createTranslate } from 'src/intl/translate';

import { SnapshotsListSection } from './snapshots-list/snapshots-list';
import { VolumesListSection } from './volumes-list/volumes-list';

const T = createTranslate('pages.volumes');

export function VolumesPage() {
  const t = T.useTranslate();

  return (
    <div className="col gap-8">
      <DocumentTitle title={t('documentTitle')} />
      <VolumesListSection />
      <SnapshotsListSection />
    </div>
  );
}
