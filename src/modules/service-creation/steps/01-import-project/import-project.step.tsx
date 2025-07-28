import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';

import { DockerImageSelector } from './docker-image-selector';
import { RepositorySelector } from './repository-selector';

export function ImportProjectStep() {
  const type = useSearchParams().get('type');
  const navigate = useNavigate();

  useMount(() => {
    void navigate({
      to: '/services/new',
      search: (prev) => ({ ...prev, repository: undefined, image: undefined }),
      replace: true,
    });
  });

  return (
    <>
      {type === 'git' && (
        <RepositorySelector
          onImport={(repository) => {
            void navigate({
              to: '/services/new',
              search: (prev) => ({
                ...prev,
                step: 'builder',
                repository: `github.com/${repository}`,
              }),
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

            void navigate({
              to: '/services/new',
              search: (prev) => ({
                ...prev,
                step: 'instanceRegions',
                image,
              }),
            });
          }}
        />
      )}
    </>
  );
}
