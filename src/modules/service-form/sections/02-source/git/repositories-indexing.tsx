import { Spinner } from '@koyeb/design-system';
import { useGithubApp } from 'src/api/hooks/git';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.serviceForm.source');

export function RepositoriesIndexing() {
  const githubApp = useGithubApp();

  useGithubApp(githubApp?.indexing ? 500 : undefined);

  return (
    <div className="row my-4 items-center gap-4">
      <Spinner progress={githubApp?.indexingPercent ?? undefined} className="size-6" />
      <p className="text-dim">
        <T id="git.synchronizingRepositories" />
      </p>
    </div>
  );
}
