import { Input } from '@koyeb/design-system';
import { useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useTranslate } from 'src/intl/translate';
import { GitRepository } from 'src/model';

import { fetchGithubRepository } from './github-api';
import { parseGithubRepositoryQuery } from './parse-github-repository-query';

type PublicGithubRepositoryInputOwnProps = {
  value: string;
  onChange: (value: string) => void;
  onRepositoryFetched: (repository: GitRepository) => void;
  onError: (error: string) => void;
};

type PublicGithubRepositoryInputProps = Omit<
  React.ComponentProps<typeof Input>,
  keyof PublicGithubRepositoryInputOwnProps
> &
  PublicGithubRepositoryInputOwnProps;

export function PublicGithubRepositoryInput({
  value,
  onChange,
  onRepositoryFetched,
  onError,
  ...props
}: PublicGithubRepositoryInputProps) {
  const translate = useTranslate();

  const { mutate } = useMutation({
    mutationKey: ['fetchPublicRepository'],
    mutationFn: (name: string) => fetchGithubRepository(name),
    onSuccess: onRepositoryFetched,
    onError(error) {
      if (error.message === 'GithubRepositoryNotFound') {
        onError(translate('common.githubRepositoryNotFound'));
      } else if (error.message === 'GithubApiQuotaExceeded') {
        onError(translate('common.githubApiQuotaExceeded'));
      } else {
        onError(error.message);
      }
    },
  });

  useEffect(() => {
    const repositoryName = parseGithubRepositoryQuery(value);

    if (!repositoryName) {
      return;
    }

    const timeout = setTimeout(() => mutate(repositoryName), 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [value, mutate]);

  return <Input value={value} onChange={(event) => onChange(event.target.value)} {...props} />;
}
