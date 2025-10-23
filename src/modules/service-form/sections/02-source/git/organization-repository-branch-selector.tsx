import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { apiQuery } from 'src/api';
import { ControlledCombobox } from 'src/components/forms/combobox';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { useFormValues } from 'src/hooks/form';
import { IconGitBranch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { ServiceForm } from '../../../service-form.types';

const T = createTranslate('modules.serviceForm.source.git');

export function OrganizationRepositoryBranchSelector() {
  const values = useFormValues<ServiceForm>();
  const repositoryId = values.source.git.organizationRepository.id;

  const [search, setSearch] = useState('');

  const selectedRepository = values.source.git.organizationRepository;
  const searchQuery = search === selectedRepository.branch ? undefined : search;

  const query = useQuery({
    ...apiQuery('get /v1/git/branches', {
      query: {
        repository_id: repositoryId as string,
        name: searchQuery || undefined,
        limit: '100',
      },
    }),
    enabled: repositoryId !== null,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    select: ({ branches }) => branches!.map((branch) => branch.name!),
  });

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
