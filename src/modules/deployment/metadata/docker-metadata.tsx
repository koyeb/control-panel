import { Metadata } from 'src/components/metadata';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.deployment.deploymentInfo');

export function DockerImageMetadata({ image }: { image: string }) {
  return (
    <Metadata
      label={<T id="dockerImageLabel" />}
      value={
        <div className="row items-center gap-2">
          <div>
            <IconDocker className="size-em" />
          </div>
          <div>{image}</div>
        </div>
      }
    />
  );
}
