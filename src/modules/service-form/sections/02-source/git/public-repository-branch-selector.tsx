import { useState } from 'react';

import { ControlledCombobox } from 'src/components/forms/combobox';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { useFormValues } from 'src/hooks/form';
import { IconGitBranch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../../service-form.types';

const T = createTranslate('modules.serviceForm.source.git');

type PublicRepositoryBranchSelectorProps = {
  branches: string[];
};

export function PublicRepositoryBranchSelector({ branches }: PublicRepositoryBranchSelectorProps) {
  const [filteredBranches, setFilteredBranches] = useState(branches);
  const selectedRepository = useFormValues<ServiceForm>().source.git.publicRepository;

  return (
    <ControlledCombobox<ServiceForm, 'source.git.publicRepository.branch', string>
      name="source.git.publicRepository.branch"
      label={<T id="branchLabel" />}
      tooltip={<T id="branchTooltip" />}
      disabled={selectedRepository.repositoryName === null}
      items={filteredBranches}
      getKey={String}
      getValue={identity}
      itemToString={identity}
      renderItem={(branch) => <BranchItem branch={branch} />}
      renderNoItems={() => <NoItems message={<T id="branchNoResults" />} />}
      onInputValueChange={(inputValue, isSelected) => {
        if (!isSelected) {
          setFilteredBranches(branches.filter((branch) => branch.includes(inputValue)));
        }
      }}
      onClosed={() => setFilteredBranches(branches)}
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
