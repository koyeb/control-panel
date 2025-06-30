import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useRepositories } from 'src/api/hooks/git';
import { GitRepository } from 'src/api/model';
import { ControlledAutocomplete } from 'src/components/controlled';
import { IconGithub, IconLock } from 'src/components/icons';
import { useEntityAdapter } from 'src/hooks/entity-adapter';
import { useFormValues } from 'src/hooks/form';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { getId, getName } from 'src/utils/object';

import { useGenerateServiceName } from '../../00-service-name/use-generate-service-name';
import { ServiceForm } from '../../../service-form.types';

const T = createTranslate('modules.serviceForm.source.git');

export function OrganizationRepositorySelector() {
  const t = T.useTranslate();

  const generateServiceName = useGenerateServiceName();
  const { setValue } = useFormContext<ServiceForm>();
  const [search, setSearch] = useState('');

  const selected = useFormValues<ServiceForm>().source.git.organizationRepository;
  const searchQuery = search === selected.repositoryName ? '' : search;

  const queryClient = useQueryClient();

  const repositories = useRepositories(searchQuery);

  const [allRepositories, { addMany: addRepositories }] = useEntityAdapter(
    (repository) => repository.id,
    queryClient.getQueryData<GitRepository[]>(['listRepositories', selected.repositoryName, 'equality']),
  );

  useEffect(() => {
    addRepositories(...repositories);
  }, [repositories, addRepositories]);

  return (
    <ControlledAutocomplete<ServiceForm, 'source.git.organizationRepository.repositoryName', GitRepository>
      name="source.git.organizationRepository.repositoryName"
      items={repositories}
      allItems={Array.from(allRepositories.values())}
      getKey={getId}
      itemToValue={getName}
      itemToString={getName}
      renderItem={(repository) => <RepositoryItem repository={repository} />}
      renderNoItems={() => <T id="organizationRepositoryNoResults" />}
      label={<T id="organizationRepository" />}
      placeholder={t('organizationRepositoryPlaceholder')}
      onInputValueChange={setSearch}
      onChangeEffect={(repository) => {
        setValue('source.git.organizationRepository.id', repository.id);
        setValue('source.git.organizationRepository.branch', repository.defaultBranch);
        generateServiceName();
      }}
      className="max-w-md"
    />
  );
}

type OrganizationRepositoryItemProps = {
  repository: GitRepository;
};

function RepositoryItem({ repository }: OrganizationRepositoryItemProps) {
  return (
    <div className="row items-center gap-2">
      <IconGithub className="icon" />

      <span className="flex-1 text-xs font-medium">
        {repository.name.replace(/.*\//, '')}

        <span className="mx-1">&bull;</span>

        <span className="text-dim">
          <FormattedDistanceToNow value={repository.lastPushDate} />
        </span>
      </span>

      {repository.isPrivate && <IconLock className="icon" />}
    </div>
  );
}
