import { useNavigate, useSearch } from '@tanstack/react-router';

import { DockerImageSelector } from './docker-image-selector';
import { RepositorySelector } from './repository-selector';

export function ImportProjectStep() {
  const { type } = useSearch({ from: '/_main/services/new' });
  const navigate = useNavigate({ from: '/services/new' });

  return (
    <>
      {type === 'git' && (
        <RepositorySelector
          onImport={(repository) => {
            navigate({
              search: (prev) => ({
                ...prev,
                step: 'instanceRegions',
                repository,
              }),
            });
          }}
        />
      )}

      {type === 'docker' && (
        <DockerImageSelector
          onSelected={(image, secretName) => {
            navigate({
              search: (prev) => ({
                ...prev,
                step: 'instanceRegions',
                image,
              }),
            });

            if (secretName) {
              // eslint-disable-next-line
              (window as any).__KOYEB_REGISTRY_SECRET_HACK = secretName;
            }
          }}
        />
      )}
    </>
  );
}
