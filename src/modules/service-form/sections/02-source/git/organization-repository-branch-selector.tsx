import { useState } from 'react';

import { useRepositoryBranchesQuery } from 'src/api';
import { ControlledCombobox } from 'src/components/forms/combobox';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { IconGitBranch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { useWatchServiceForm } from 'src/modules/service-form/use-service-form';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../../service-form.types';

const T = createTranslate('modules.serviceForm.source.git');

export function OrganizationRepositoryBranchSelector() {
  const selectedRepository = useWatchServiceForm('source.git.organizationRepository');

  const [search, setSearch] = useState('');
  const query = useRepositoryBranchesQuery(selectedRepository.id, search);

  return (
    <ControlledCombobox<ServiceForm, 'source.git.organizationRepository.branch', string>
      name="source.git.organizationRepository.branch"
      label={<T id="branchLabel" />}
      tooltip={<T id="branchTooltip" />}
      disabled={selectedRepository.repositoryName === null}
      items={query.data ?? []}
      getKey={identity}
      getValue={identity}
      itemToString={identity}
      renderItem={(branch) => <BranchItem branch={branch} />}
      renderNoItems={() => <NoItems message={<T id="branchNoResults" />} />}
      onInputValueChange={setSearch}
      className="max-w-md"
    />
  );
}

type BranchItemProps = {
  branch: string | null;
};

function BranchItem({ branch }: BranchItemProps) {
  return (
    <div className="row gap-2">
      <div>
        <IconGitBranch className="icon" />
      </div>
      <div className="truncate">{branch}</div>
    </div>
  );
}
