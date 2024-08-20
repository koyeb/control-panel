import { Metadata } from 'src/components/metadata';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('deploymentInfo');

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
