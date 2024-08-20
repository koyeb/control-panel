import IconBranch from 'lucide-static/icons/git-branch.svg?react';
import { useState } from 'react';

import { ControlledAutocomplete } from 'src/components/controlled';
import { useFormValues } from 'src/hooks/form';
import { Translate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../../service-form.types';

const T = Translate.prefix('serviceForm.source.git');

type PublicRepositoryBranchSelectorProps = {
  branches: string[];
};

export function PublicRepositoryBranchSelector({ branches }: PublicRepositoryBranchSelectorProps) {
  const selectedRepository = useFormValues<ServiceForm>().source.git.publicRepository;
  const [search, setSearch] = useState('');
  const searchQuery = search === selectedRepository.branch ? '' : search;

  return (
    <ControlledAutocomplete<ServiceForm, 'source.git.publicRepository.branch'>
      name="source.git.publicRepository.branch"
      label={<T id="branchLabel" />}
      helpTooltip={<T id="branchTooltip" />}
      disabled={selectedRepository.repositoryName === null}
      items={branches.filter((branch) => branch.includes(searchQuery))}
      allItems={branches.filter((branch) => branch.includes(searchQuery))}
      getKey={String}
      itemToValue={identity}
      itemToString={identity}
      renderItem={(branch) => <BranchItem branch={branch} />}
      renderNoItems={() => <T id="branchNoResults" />}
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
        <IconBranch className="icon" />
      </div>
      <div className="truncate">{branch}</div>
    </div>
  );
}
