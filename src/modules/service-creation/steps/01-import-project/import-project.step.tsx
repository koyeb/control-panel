import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParam } from 'src/hooks/router';

import { DockerImageSelector } from './docker-image-selector';
import { RepositorySelector } from './repository-selector';

export function ImportProjectStep() {
  const [type] = useSearchParam('type');
  const navigate = useNavigate();

  useMount(() => {
    navigate(
      (url) => {
        url.searchParams.delete('repository');
        url.searchParams.delete('image');
      },
      { replace: true },
    );
  });

  return (
    <>
      {type === 'git' && (
        <RepositorySelector
          onImport={(repository) => {
            navigate((url) => {
              url.searchParams.set('repository', `github.com/${repository}`);
              url.searchParams.set('step', `instanceRegions`);
            });
          }}
        />
      )}

      {type === 'docker' && (
        <DockerImageSelector
          onSelected={(image, secretName) => {
            if (secretName) {
              // eslint-disable-next-line
              (window as any).__KOYEB_REGISTRY_SECRET_HACK = secretName;
            }

            navigate((url) => {
              url.searchParams.set('image', image);
              url.searchParams.set('step', `instanceRegions`);
            });
          }}
        />
      )}
    </>
  );
}
