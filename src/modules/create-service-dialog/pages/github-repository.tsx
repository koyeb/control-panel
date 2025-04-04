import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@koyeb/design-system';
import { useGithubApp, useRepositories } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { GitRepository } from 'src/api/model';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { routes } from 'src/application/routes';
import { IconLock, IconGithub, IconArrowRight } from 'src/components/icons';
import { ListItem, ListSections } from 'src/components/list';
import { PublicGithubRepositoryInput } from 'src/components/public-github-repository-input/public-github-repository-input';
import { handleSubmit } from 'src/hooks/form';
import { useShortcut } from 'src/hooks/shortcut';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { createTranslate } from 'src/intl/translate';

import { useCreateServiceDialog } from '../use-create-service-dialog';

const T = createTranslate('modules.createServiceDialog');

export function GithubOrganizationImage() {
  const githubApp = useGithubApp();

  if (!githubApp) {
    return null;
  }

  return (
    <img src={`https://github.com/${githubApp.organizationName}.png?size=20`} className="icon rounded-full" />
  );
}

export function OrganizationRepositoriesList() {
  const { serviceType, search, navigate } = useCreateServiceDialog();
  const [activeIndex, setActiveIndex] = useState(0);

  const repositories = useRepositories(search);

  const onSelect = (repository: GitRepository) => {
    const params = new URLSearchParams([
      ['service_type', serviceType as string],
      ['type', 'git'],
      ['repository', repository.name],
    ]);

    navigate(`${routes.deploy()}?${params.toString()}`);
  };

  useShortcut(['ArrowUp'], () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  });

  useShortcut(['ArrowDown'], () => {
    if (activeIndex < repositories.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  });

  useShortcut(['Enter'], () => {
    const repository = repositories[activeIndex];

    if (repository) {
      onSelect(repository);
    }
  });

  return (
    <div className="col p-2">
      <ListSections
        sections={[{ title: <T id="repositories" />, items: repositories }]}
        renderItem={(repository, index) => (
          <ListItem
            isActive={index === activeIndex}
            start={<IconGithub className="icon" />}
            end={repository.isPrivate && <IconLock className="icon" />}
            onClick={() => onSelect(repository)}
            className="cursor-pointer"
          >
            <div>
              {repository.name.replace(/.*\//, '')}

              <span className="mx-1">&bull;</span>

              <span className="font-normal text-dim">
                <FormattedDistanceToNow value={repository.lastPushDate} />
              </span>
            </div>
          </ListItem>
        )}
      />

      <p className="mt-auto text-xs text-dim">
        <GithubAppLinks />
      </p>
    </div>
  );
}

function GithubAppLinks() {
  const t = T.useTranslate();

  const organization = useOrganization();
  const githubApp = useGithubApp();

  const { mutate: resync } = useMutation({
    ...useApiMutationFn('resyncRepositories', {
      path: { organization_id: organization.id },
    }),
    onMutate() {
      notify.info(t('repositoriesSynchronized'));
    },
  });

  return (
    <T
      id="githubAppLinks"
      values={{
        resynchronizeLink: (children) => (
          <button type="button" className="text-link" onClick={() => resync()}>
            {children}
          </button>
        ),
        githubAppLink: (children) => (
          <button
            type="button"
            className="text-link"
            onClick={() => (window.location.href = githubApp!.installationUrl)}
          >
            {children}
          </button>
        ),
      }}
    />
  );
}

export function PublicRepository() {
  const t = T.useTranslate();
  const { serviceType, navigate } = useCreateServiceDialog();

  const schema = z.object({
    url: z.string().refine((url) => url.match(/.+\/.+/), t('invalidGithubRepositoryUrl')),
    repositoryName: z.string().min(1),
  });

  const form = useForm({
    defaultValues: {
      url: '',
      repositoryName: '',
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = (repositoryName: string) => {
    const params = new URLSearchParams({
      service_type: serviceType as string,
      type: 'git',
      repository: repositoryName,
    });

    navigate(`${routes.deploy()}?${params.toString()}`);
  };

  return (
    <form
      className="col gap-4 p-5"
      onSubmit={handleSubmit(form, ({ repositoryName }) => onSubmit(repositoryName))}
    >
      <Controller
        control={form.control}
        name="url"
        render={({ field, fieldState }) => (
          <PublicGithubRepositoryInput
            label={<T id="publicRepositoryLabel" />}
            placeholder={t('publicRepositoryPlaceholder')}
            value={field.value}
            onChange={(url) => {
              field.onChange(url);
              form.setValue('repositoryName', '');
            }}
            onRepositoryFetched={(repository) => {
              field.onChange(repository.url);
              form.setValue('repositoryName', repository.name, { shouldValidate: true });
            }}
            onError={(message) => form.setError('url', { message })}
            error={fieldState.error?.message}
          />
        )}
      />

      <Button type="submit" className="self-start" disabled={Object.keys(form.formState.errors).length > 0}>
        <T id="deployRepository" />
        <IconArrowRight className="size-icon" />
      </Button>
    </form>
  );
}
