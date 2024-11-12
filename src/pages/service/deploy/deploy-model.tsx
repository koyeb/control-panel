import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { HuggingFaceModel } from 'src/api/model';
import { DocumentTitle } from 'src/components/document-title';
import { IconPackage } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { ServiceEstimatedCost } from 'src/components/service-estimated-cost';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ServiceCost } from 'src/modules/service-form/helpers/estimated-cost';
import { ModelForm } from 'src/modules/service-form/model-form';

const T = Translate.prefix('pages.deploy.model');

export function DeployModel() {
  const [model] = useSearchParam('model');
  const [cost, setCost] = useState<ServiceCost>();
  const t = T.useTranslate();

  const query = useQuery({
    queryKey: ['getHuggingFaceModel', model],
    refetchInterval: false,
    enabled: model !== null,
    async queryFn() {
      const response = await fetch(`https://huggingface.co/api/models/${model}`);

      if (!response.ok) {
        throw new Error('Failed to fetch model from hugging face');
      }

      const body = (await response.json()) as HuggingFaceModel;

      return body;
    },
  });

  if (query.isFetching) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return (
    <div className="col gap-6">
      <DocumentTitle title={t('documentTitle')} />

      <div className="col xl:row gap-8">
        <div className="flex-1">
          <Header model={query.data} />
          <ModelForm model={query.data} onCostChanged={setCost} />
        </div>

        <div className="col shrink-0 gap-8 xl:basis-80">
          <ServiceEstimatedCost cost={cost} />
        </div>
      </div>
    </div>
  );
}

function Header({ model }: { model?: HuggingFaceModel }) {
  return (
    <header className="row mb-10 items-center gap-4">
      <div>
        <IconPackage className="size-14 rounded-md" />
      </div>

      <div className="col gap-1">
        <div className="text-2xl">
          {model ? <T id="titleModel" values={{ model: model.id }} /> : <T id="title" />}
        </div>
        <div className="text-dim">
          <T id="description" />
        </div>
      </div>
    </header>
  );
}
