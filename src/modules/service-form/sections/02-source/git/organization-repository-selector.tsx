import { useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useRepositories } from 'src/api';
import { ControlledCombobox } from 'src/components/forms';
import { NoItems } from 'src/components/forms/helpers/no-items';
import { useFormValues } from 'src/hooks/form';
import { IconGithub, IconLock } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';
import { GitRepository } from 'src/model';
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

  const repositories = useRepositories(searchQuery);

  return (
    <ControlledCombobox<ServiceForm, 'source.git.organizationRepository.repositoryName', GitRepository>
      name="source.git.organizationRepository.repositoryName"
      items={repositories}
      getKey={getId}
      getValue={getName}
      itemToString={getName}
      renderItem={(repository) => <RepositoryItem repository={repository} />}
      renderNoItems={() => <NoItems message={<T id="organizationRepositoryNoResults" />} />}
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
