import { DeploymentDefinition } from 'src/api/model';
import { IconArchive, IconGithub } from 'src/components/icons';
import { ExternalLink } from 'src/components/link';
import IconDocker from 'src/icons/docker.svg?react';
import { Translate } from 'src/intl/translate';

const T = Translate.prefix('pages.home.deploymentSource');

type DeploymentSourceProps = {
  source: DeploymentDefinition['source'];
};

export function DeploymentSource({ source }: DeploymentSourceProps) {
  if (source.type === 'archive') {
    return (
      <div className="row items-center gap-2">
        <div>
          <IconArchive className="size-4" />
        </div>
        <div className="truncate">
          <T id="archive" />
        </div>
      </div>
    );
  }

  if (source.type === 'git') {
    return (
      <ExternalLink href={'https://' + source.repository} className="row items-center gap-2 hover:underline">
        <div>
          <IconGithub className="size-4" />
        </div>
        <div className="truncate">{source.repository.replace(/^github.com\//, '')}</div>
      </ExternalLink>
    );
  }

  if (source.type === 'docker') {
    return (
      <div className="row items-center gap-2">
        <div>
          <IconDocker className="size-4" />
        </div>
        <div className="truncate">{source.image}</div>
      </div>
    );
  }

  return null;
}
