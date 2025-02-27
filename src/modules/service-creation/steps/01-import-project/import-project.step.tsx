import { useMount } from 'src/hooks/lifecycle';
import { useNavigate, useSearchParam } from 'src/hooks/router';

import { DockerImageSelector } from './docker-image-selector';
import { RepositorySelector } from './repository-selector';

type ImportProjectStepProps = {
  onNext: () => void;
};

export function ImportProjectStep({ onNext }: ImportProjectStepProps) {
  const [type] = useSearchParam('type');
  const [, setRepository] = useSearchParam('repository');
  const [, setImage] = useSearchParam('image');
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
            setRepository(`github.com/${repository}`, { replace: true });
            onNext();
          }}
        />
      )}

      {type === 'docker' && (
        <DockerImageSelector
          onSelected={(image, secretName) => {
            setImage(image, { replace: true });

            if (secretName) {
              // eslint-disable-next-line
              (window as any).__KOYEB_REGISTRY_SECRET_HACK = secretName;
            }

            onNext();
          }}
        />
      )}
    </>
  );
}
