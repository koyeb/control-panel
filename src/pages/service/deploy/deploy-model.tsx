import { useState } from 'react';

import { useModel } from 'src/api/hooks/catalog';
import { AiModel } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { IconPackage } from 'src/components/icons';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ModelForm } from 'src/modules/service-form/model-form';

const T = Translate.prefix('pages.deploy.model');

export function DeployModel() {
  const [modelParam] = useSearchParam('model');
  const [cost, setCost] = useState<ServiceCost>();
  const t = T.useTranslate();

  const model = useModel(modelParam ?? undefined);

  return (
    <div className="col gap-6">
      <DocumentTitle
        title={model ? (t('documentTitleModel', { modelName: model?.name }) as string) : t('documentTitle')}
      />

      <Header model={model} />

      <div className="col xl:row gap-8">
        <div className="flex-1">
          <ModelForm model={model} onCostChanged={setCost} />
        </div>

        <div className="col shrink-0 gap-8 xl:basis-80">
          <section>
            <div className="mb-2 text-sm font-medium">
              <T id="pricing" />
            </div>
            <ServiceEstimatedCost cost={cost} />
          </section>
        </div>
      </div>
    </div>
  );
}

function Header({ model }: { model?: AiModel }) {
  return (
    <header className="col mb-10 items-center gap-4 text-center">
      <div>
        <IconPackage className="size-14 rounded-md" />
      </div>

      <div className="col gap-1">
        <div className="text-2xl">
          {model ? <T id="titleModel" values={{ modelName: model?.name }} /> : <T id="title" />}
        </div>
        <div className="max-w-xl text-dim">{model?.description ?? <T id="anyModelDescription" />}</div>
      </div>
    </header>
  );
}
