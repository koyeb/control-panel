import { useState } from 'react';

import { SvgComponent } from 'src/application/types';
import { ControlledRadio } from 'src/components/forms';
import { IconArchive, IconDocker, IconGitBranch, IconGithub } from 'src/icons';
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
      title={<T id="title" />}
      action={<T id="action" />}
      summary={
        <>
          {sourceType === 'archive' && <ArchiveSummary />}
          {sourceType === 'git' && <GitSummary />}
          {sourceType === 'docker' && <DockerSummary />}
        </>
      }
      className="col gaps"
    >
      <div className="col gap-6 sm:row">
        {showArchive && (
          <ControlledRadio
            name="source.type"
            value="archive"
            label={<T id="archiveSourceLabel" />}
            tooltip={<T id="archiveSourceTooltip" />}
          />
        )}

        <ControlledRadio
          name="source.type"
          value="git"
          label={<T id="githubSourceLabel" />}
          tooltip={<T id="githubSourceTooltip" />}
        />

        <ControlledRadio
          name="source.type"
          value="docker"
          label={<T id="dockerSourceLabel" />}
          tooltip={<T id="dockerSourceTooltip" />}
        />
      </div>

      {sourceType === 'archive' && <ArchiveSource />}
      {sourceType === 'git' && <GitSource />}
      {sourceType === 'docker' && <DockerSource />}
    </ServiceFormSection>
  );
}

function ArchiveSummary() {
  return <IconLabel Icon={IconArchive} label={<T id="archive.title" />} />;
}

function GitSummary() {
  const repositoryType = useWatchServiceForm('source.git.repositoryType');
  const repository = useWatchServiceForm(`source.git.${repositoryType}Repository.repositoryName`);
  const branch = useWatchServiceForm(`source.git.${repositoryType}Repository.branch`);

  if (repository === null) {
    return <IconLabel Icon={IconGithub} label={<T id="noRepositorySelected" />} />;
  }

  return (
    <div className="row gap-4">
      <IconLabel Icon={IconGithub} label={repository} />
      <IconLabel Icon={IconGitBranch} label={branch} />
    </div>
  );
}

function DockerSummary() {
  const image = useWatchServiceForm('source.docker.image');

  if (image === '') {
    return <T id="noDockerImageSelected" />;
  }

  return <IconLabel Icon={IconDocker} label={image} />;
}

function IconLabel({ Icon, label }: { Icon: SvgComponent; label: React.ReactNode }) {
  return (
    <div className="row items-center gap-2">
      <Icon className="size-4 text-dim" /> {label}
    </div>
  );
}
