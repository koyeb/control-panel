import { type RegistryType } from 'src/api/model';
import { IconGithub } from 'src/components/icons';
import IconAzure from 'src/icons/azure.svg?react';
import IconDigitalOcean from 'src/icons/digital-ocean.svg?react';
import IconDockerHub from 'src/icons/docker-hub.svg?react';
import IconGcp from 'src/icons/gcp.svg?react';
import IconGitlab from 'src/icons/gitlab.svg?react';
import IconPrivateRegistry from 'src/icons/private-registry.svg?react';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('modules.secrets');

type RegistryTypeProps = {
  registry: RegistryType;
};

export function RegistryType({ registry }: RegistryTypeProps) {
  const Icon = {
    'docker-hub': IconDockerHub,
    'digital-ocean': IconDigitalOcean,
    github: IconGithub,
    gitlab: IconGitlab,
    azure: IconAzure,
    gcp: IconGcp,
    private: IconPrivateRegistry,
  }[registry];

  const name = {
    'docker-hub': <T id="registries.docker-hub" />,
    'digital-ocean': <T id="registries.digital-ocean" />,
    github: <T id="registries.github" />,
    gitlab: <T id="registries.gitlab" />,
    azure: <T id="registries.azure" />,
    gcp: <T id="registries.gcp" />,
    private: <T id="registries.private" />,
  }[registry];

  return (
    <div className="row items-center gap-2">
      <Icon className="icon" /> {name}
    </div>
  );
}
