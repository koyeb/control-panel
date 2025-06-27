import { useState } from 'react';

import { ControlledRadio } from 'src/components/controlled';
import { IconArchive, IconBranch, IconGithub } from 'src/components/icons';
import IconDocker from 'src/icons/docker.svg?react';
import { createTranslate } from 'src/intl/translate';

import { ServiceFormSection } from '../../components/service-form-section';
import { useWatchServiceForm } from '../../use-service-form';

import { ArchiveSource } from './archive/archive-source';
import { DockerSource } from './docker/docker-source';
import { GitSource } from './git/git-source';

const T = createTranslate('modules.serviceForm.source');

export function SourceSection() {
  const sourceType = useWatchServiceForm('source.type');
  const [showArchive] = useState(sourceType === 'archive');

  return (
    <ServiceFormSection
      section="source"
      title={
        <>
          {sourceType === 'archive' && <ArchiveSectionTitle />}
          {sourceType === 'git' && <GitSectionTitle />}
          {sourceType === 'docker' && <DockerSectionTitle />}
        </>
      }
      expandedTitle={<T id="expandedTitle" />}
      description={<T id="description" />}
      className="col gaps"
    >
      <div className="col gap-6 sm:row">
        {showArchive && (
          <ControlledRadio
            name="source.type"
            value="archive"
            label={<T id="archiveSourceLabel" />}
            helpTooltip={<T id="archiveSourceTooltip" />}
          />
        )}

        <ControlledRadio
          name="source.type"
          value="git"
          label={<T id="githubSourceLabel" />}
          helpTooltip={<T id="githubSourceTooltip" />}
        />

        <ControlledRadio
          name="source.type"
          value="docker"
          label={<T id="dockerSourceLabel" />}
          helpTooltip={<T id="dockerSourceTooltip" />}
        />
      </div>

      {sourceType === 'archive' && <ArchiveSource />}
      {sourceType === 'git' && <GitSource />}
      {sourceType === 'docker' && <DockerSource />}
    </ServiceFormSection>
  );
}

function ArchiveSectionTitle() {
  return (
    <div className="row items-center gap-2">
      <IconArchive className="icon" />
      <T id="archive.title" />
    </div>
  );
}

function GitSectionTitle() {
  const repositoryType = useWatchServiceForm('source.git.repositoryType');
  const repository = useWatchServiceForm(`source.git.${repositoryType}Repository`);

  if (repository.repositoryName === null) {
    return <T id="noRepositorySelected" />;
  }

  return (
    <div className="row gap-4">
      <div className="row items-center gap-2">
        <IconGithub className="icon" /> {repository.repositoryName}
      </div>

      <div className="row items-center gap-2">
        <IconBranch className="icon" /> {repository.branch}
      </div>
    </div>
  );
}

function DockerSectionTitle() {
  const docker = useWatchServiceForm('source.docker');

  if (docker.image === '') {
    return <T id="noDockerImageSelected" />;
  }

  return (
    <div className="row items-center gap-2">
      <IconDocker className="icon" /> {docker.image}
    </div>
  );
}
