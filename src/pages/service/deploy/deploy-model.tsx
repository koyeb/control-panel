import { aiModels } from 'src/application/models';
import { IconPackage } from 'src/components/icons';
import { useSearchParam } from 'src/hooks/router';
import { ModelForm } from 'src/modules/service-form/model-form';
import { assert } from 'src/utils/assert';

export function DeployModel() {
  const [model] = useSearchParam('model');
  assert(model !== null);

  return (
    <>
      <Header model={model} />
      <ModelForm model={model} />
    </>
  );
}

function Header({ model }: { model: string }) {
  return (
    <header className="col my-6 items-center gap-4 sm:my-12">
      <div className="rounded-md bg-black/60 p-1.5">
        <IconPackage className="size-24 rounded-md grayscale" />
      </div>

      <div className="col max-w-md gap-2 text-center">
        <div className="text-2xl">Deploy AI model</div>
        <div className="text-lg text-dim">
          Deploy {aiModels[model] ?? 'your AI model'} on a high performance GPU hosted on Koyeb
        </div>
      </div>
    </header>
  );
}
