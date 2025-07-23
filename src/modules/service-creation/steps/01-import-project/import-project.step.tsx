import { useFeatureFlag } from 'src/hooks/feature-flag';
import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParams } from 'src/hooks/router';

import { DockerImageSelector } from './docker-image-selector';
import { RepositorySelector } from './repository-selector';

export function ImportProjectStep() {
  const hasBuilderStep = useFeatureFlag('service-creation-builder-step');
  const type = useSearchParams().get('type');
  const navigate = useNavigate();

  useMount(() => {
    navigate({
      to: '/services/new',
      search: (prev) => ({ ...prev, repository: null, image: null }),
      replace: true,
    });
  });

  return (
    <>
      {type === 'git' && (
        <RepositorySelector
          onImport={(repository) => {
            navigate({
              to: '/services/new',
              search: (prev) => ({
                ...prev,
                step: hasBuilderStep ? 'builder' : 'instanceRegions',
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

            navigate({
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
