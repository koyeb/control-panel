import { useState } from 'react';

import { DocumentTitle } from 'src/components/document-title';
import { Translate } from 'src/intl/translate';
import { DatabaseEstimatedCost } from 'src/modules/database-form/database-estimated-cost';
import { DatabaseForm } from 'src/modules/database-form/database-form';

const T = Translate.prefix('pages.createDatabaseService');

export function CreateDatabasePage() {
  const t = T.useTranslate();
  const [cost, setCost] = useState<number>();

  return (
    <div className="col gap-8">
      <DocumentTitle title={t('documentTitle')} />

      <div className="col gap-2">
        <h1 className="typo-heading">
          <T id="title" />
        </h1>
        <p className="text-dim">
          <T id="description" />
        </p>
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_20rem]">
        <DatabaseForm onCostChanged={setCost} />

        <div className="col max-w-sm gap-8 xl:w-full">
          <Tips />
          <DatabaseEstimatedCost cost={cost} />
        </div>
      </div>
    </div>
  );
}

function Tips() {
  return (
    <div className="card col gap-2 p-4">
      <span className="font-medium">
        <T id="tips.title" />
      </span>

      <span className="text-dim">
        <T id="tips.tip" />
      </span>
    </div>
  );
}
