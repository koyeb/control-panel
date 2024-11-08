import { useQuery } from '@tanstack/react-query';

import { HuggingFaceModel } from 'src/api/model';
import { IconPackage } from 'src/components/icons';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useSearchParam } from 'src/hooks/router';
import { Translate } from 'src/intl/translate';
import { ModelForm } from 'src/modules/service-form/model-form';

const T = Translate.prefix('pages.deploy.model');

export function DeployModel() {
  const [model] = useSearchParam('model');

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
    <>
      <Header model={query.data} />
      <ModelForm model={query.data} />
    </>
  );
}

function Header({ model }: { model?: HuggingFaceModel }) {
  return (
    <header className="col my-6 items-center gap-4 sm:my-12">
      <div className="rounded-md bg-black/10 p-1.5 dark:bg-black/60">
        <IconPackage className="size-24 rounded-md grayscale" />
      </div>

      <div className="col max-w-md gap-2 text-center">
        <div className="text-2xl">
          {model ? <T id="titleModel" values={{ model: model.id }} /> : <T id="title" />}
        </div>
        <div className="text-lg text-dim">
          <T id="description" />
        </div>
      </div>
    </header>
  );
}
