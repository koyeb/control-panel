import { type RegistryType } from 'src/api/model';
import {
  IconAzure,
  IconDigitalOcean,
  IconDockerHub,
  IconGcp,
  IconGithub,
  IconGitlab,
  IconPrivateRegistry,
} from 'src/icons';
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
