import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { PublicGithubRepositoryInput } from 'src/components/public-github-repository-input/public-github-repository-input';
import { createTranslate } from 'src/intl/translate';
import { GitRepository } from 'src/model';

import { useGenerateServiceName } from '../../00-service-name/use-generate-service-name';
import { ServiceForm } from '../../../service-form.types';

import { PublicRepositoryBranchSelector } from './public-repository-branch-selector';

const T = createTranslate('modules.serviceForm.source.git');

export function PublicRepository() {
  const t = T.useTranslate();

  const generateServiceName = useGenerateServiceName();
  const { getValues, setValue, setError } = useFormContext<ServiceForm>();

  const queryClient = useQueryClient();

  const [repository, setRepository] = useState(
    queryClient.getQueryData<GitRepository>([
      'getPublicRepository',
      getValues('source.git.publicRepository.repositoryName'),
    ]),
  );

  return (
    <>
      <Controller<ServiceForm, 'source.git.publicRepository.url'>
        name="source.git.publicRepository.url"
        render={({ field, fieldState }) => (
          <PublicGithubRepositoryInput
            label={<T id="publicRepositoryLabel" />}
            helpTooltip={<T id="publicRepositoryTooltip" />}
            placeholder={t('publicRepositoryPlaceholder')}
            value={field.value}
            onChange={(url) => {
              field.onChange(url);
              setValue('source.git.publicRepository.repositoryName', null);
              setValue('source.git.publicRepository.branch', null);
              setRepository(undefined);
            }}
            onRepositoryFetched={(repository) => {
              field.onChange(repository.url);

              setRepository(repository);

              setValue('source.git.publicRepository.repositoryName', repository.name, {
                shouldValidate: true,
              });

              if (getValues('source.git.publicRepository.branch') === null) {
                setValue('source.git.publicRepository.branch', repository.defaultBranch);
              }

              generateServiceName();
            }}
            onError={(message) => setError('source.git.publicRepository.url', { message })}
            error={fieldState.error?.message}
            className="max-w-md"
          />
        )}
      />

      <PublicRepositoryBranchSelector branches={repository?.branches ?? []} />
    </>
  );
}
