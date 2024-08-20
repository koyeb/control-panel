import { useGithubApp } from 'src/api/hooks/git';
import { ControlledCheckbox } from 'src/components/controlled';
import { Translate } from 'src/intl/translate';

import { ServiceForm } from '../../../service-form.types';

import { GithubAppLinks } from './github-app-links';
import { InstallGithubApp } from './install-github-app';
import { OrganizationRepositoryBranchSelector } from './organization-repository-branch-selector';
import { OrganizationRepositorySelector } from './organization-repository-selector';
import { RepositoriesIndexing } from './repositories-indexing';

const T = Translate.prefix('serviceForm.source.git');

export function OrganizationRepository() {
  const githubApp = useGithubApp();

  if (!githubApp) {
    return <InstallGithubApp />;
  }

  if (githubApp.indexing) {
    return (
      <>
        <RepositoriesIndexing />
        <GithubAppLinks />
      </>
    );
  }

  return (
    <>
      <OrganizationRepositorySelector />

      <OrganizationRepositoryBranchSelector />

      <ControlledCheckbox<ServiceForm, 'source.git.organizationRepository.autoDeploy'>
        name="source.git.organizationRepository.autoDeploy"
        label={<T id="autoDeploy" />}
        helpTooltip={<T id="autoDeployTooltip" />}
        className="self-start"
      />

      <GithubAppLinks />
    </>
  );
}
