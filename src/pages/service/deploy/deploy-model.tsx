import { useState } from 'react';

import { DocumentTitle } from 'src/components/document-title';
import { IconPackage } from 'src/components/icons';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ModelForm } from 'src/modules/service-form/model-form';

const T = Translate.prefix('pages.deploy.model');

export function DeployModel() {
  const [cost, setCost] = useState<ServiceCost>();
  const t = T.useTranslate();

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <Header />

      <div className="col xl:row gap-8">
        <div className="flex-1">
          <ModelForm onCostChanged={setCost} />
        </div>

        <div className="col shrink-0 gap-8 xl:basis-80">
          <ServiceEstimatedCost cost={cost} />
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="col mb-10 items-center gap-4 text-center">
      <div>
        <IconPackage className="size-14 rounded-md" />
      </div>

      <div className="col gap-1">
        <div className="text-2xl">
          <T id="title" />
        </div>
        <div className="text-dim">
          <T id="description" />
        </div>
      </div>
    </header>
  );
}
