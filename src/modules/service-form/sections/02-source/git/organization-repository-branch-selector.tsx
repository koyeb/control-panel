import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useApiQueryFn } from 'src/api/use-api';
import { ControlledAutocomplete } from 'src/components/controlled';
import { IconBranch } from 'src/components/icons';
import { useEntityAdapter } from 'src/hooks/entity-adapter';
import { useFormValues } from 'src/hooks/form';
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

  const { data: branches = [] } = useQuery({
    ...useApiQueryFn('listRepositoryBranches', {
      query: {
        repository_id: repositoryId as string,
        name: searchQuery || undefined,
        limit: '100',
      },
    }),
    enabled: repositoryId !== null,
    refetchOnMount: true,
    select: ({ branches }) => branches!.map((branch) => branch.name!),
  });

  const queryClient = useQueryClient();

  const [allBranches, { addMany: addBranches, clear: clearBranches }] = useEntityAdapter(
    identity,
    queryClient.getQueryData<string[]>(['listRepositoryBranches', repositoryId, '']),
  );

  useEffect(() => {
    addBranches(...branches);
  }, [branches, addBranches]);

  useEffect(() => {
    if (!repositoryId) {
      clearBranches();
    }
  }, [repositoryId, clearBranches]);

  return (
    <ControlledAutocomplete<ServiceForm, 'source.git.organizationRepository.branch'>
      name="source.git.organizationRepository.branch"
      label={<T id="branchLabel" />}
      helpTooltip={<T id="branchTooltip" />}
      disabled={selectedRepository.repositoryName === null}
      items={branches}
      allItems={Array.from(allBranches.values())}
      getKey={identity}
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
