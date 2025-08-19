import { Button, Spinner } from '@koyeb/design-system';
import { useIsMutating, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { useGithubApp, useGithubAppQuery, useRepositoriesQuery } from 'src/api/hooks/git';
import { useOrganization } from 'src/api/hooks/session';
import { useApiMutationFn } from 'src/api/use-api';
import { notify } from 'src/application/notify';
import { ActionsList, ActionsListButton } from 'src/components/actions-list';
import { ControlledInput } from 'src/components/controlled';
import { ExternalLink, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { PublicGithubRepositoryInput } from 'src/components/public-github-repository-input/public-github-repository-input';
import { BoxSkeleton, CircleSkeleton, TextSkeleton } from 'src/components/skeleton';
import { handleSubmit, useFormValues } from 'src/hooks/form';
import { useHistoryState, useLocation } from 'src/hooks/router';
import { useZodResolver } from 'src/hooks/validation';
import { IconGithub, IconLock, IconRefreshCcw } from 'src/icons';
import { FormattedDistanceToNow } from 'src/intl/formatted';
import { Translate, createTranslate } from 'src/intl/translate';
import { createArray } from 'src/utils/arrays';

const T = createTranslate('modules.serviceCreation.importProject.github');

type RepositorySelectorProps = {
  onImport: (repositoryName: string) => void;
};

export function RepositorySelector({ onImport }: RepositorySelectorProps) {
  const { data: githubApp, isPending } = useGithubAppQuery();

  if (isPending) {
    return <Loading />;
  }

  if (githubApp?.indexing) {
    return <RepositoriesIndexing />;
  }

  return (
    <>
      {githubApp === null && <InstallGithubApp />}
      {githubApp && <OrganizationRepositorySelector onImport={onImport} />}

      <PublicRepositorySelector onImport={onImport} />

      <div>
        <LinkButton color="gray" to="/services/new" search={(prev) => ({ ...prev, step: 'serviceType' })}>
          <Translate id="common.back" />
        </LinkButton>
      </div>
    </>
  );
}

function RepositoriesIndexing() {
  const githubApp = useGithubApp(500);

  return (
    <Loading>
      <div className="row items-center gap-2">
        <Spinner progress={githubApp?.indexingPercent ?? undefined} className="size-6" />
        <p className="text-dim">
          <T id="synchronizingRepositories" />
        </p>
      </div>
    </Loading>
  );
}

function InstallGithubApp() {
  const { githubAppInstallationRequested } = useHistoryState() as { githubAppInstallationRequested: boolean };
  const location = useLocation();

  const { mutate: installGithubApp } = useMutation({
    ...useApiMutationFn('installGithubApp', {
      body: { metadata: location },
    }),
    onSuccess(result) {
      window.location.href = result.url!;
    },
  });

  return (
    <div className="col min-h-44 items-center justify-center gap-4 border text-center">
      <div className="col gap-2">
        <div className="font-medium">
          <T id="installGithubApp.title" />
        </div>

        <div className="max-w-md">
          <T id={`installGithubApp.${githubAppInstallationRequested ? 'requested' : 'description'}`} />
        </div>
      </div>

      <Button onClick={() => installGithubApp()} disabled={githubAppInstallationRequested}>
        <IconGithub className="size-icon text-inherit" />
        <T id="installGithubApp.button" />
      </Button>
    </div>
  );
}

const bullet = '•';

function OrganizationRepositorySelector({ onImport }: RepositorySelectorProps) {
  const form = useForm({
    defaultValues: {
      search: '',
    },
  });

  const { search } = useFormValues(form);
  const { data: repositories = [], isPending } = useRepositoriesQuery(search);

  if (isPending) {
    return <Skeleton />;
  }

  return (
    <form
      className="col gap-6"
      onSubmit={handleSubmit(form, () => {
        const firstRepository = repositories[0];

        if (firstRepository) {
          onImport(firstRepository.name);
        }
      })}
    >
      <div className="row gap-1.5">
        <ControlledInput
          control={form.control}
          size={2}
          name="search"
          placeholder="Search GitHub repository"
          className="flex-1"
        />

        <ResynchronizeButton />
      </div>

      <ActionsList
        items={repositories.map((repository) => (
          <ActionsListButton
            key={repository.id}
            onClick={() => onImport(repository.name)}
            className="row w-full items-center gap-1"
          >
            <IconGithub className="me-1 size-icon" />

            <span>{repository.name}</span>

            <span>{repository.isPrivate && <IconLock className="size-em text-dim" />}</span>

            <span className="text-xs text-dim">{bullet}</span>

            <span className="text-xs text-dim">
              <FormattedDistanceToNow value={repository.lastPushDate} />
            </span>
          </ActionsListButton>
        ))}
      />

      {repositories.length === 0 && (
        <div className="col divide-y rounded-md border">
          <NoRepository search={search} />
        </div>
      )}

      <EditAppPermissions />
    </form>
  );
}

function Skeleton() {
  return (
    <div className="col gap-6">
      <div className="row gap-1.5">
        <BoxSkeleton className="h-8 w-full" />
        <BoxSkeleton className="h-8 w-28" />
      </div>

      <ul className="col divide-y rounded-md border">
        {createArray(5, (index) => (
          <li key={index} className="row items-center gap-1 px-3 py-2">
            <CircleSkeleton className="size-6" />
            <TextSkeleton width={16} />
            <TextSkeleton width={4} className="ml-auto" />
          </li>
        ))}
      </ul>

      <EditAppPermissions />
    </div>
  );
}

function EditAppPermissions() {
  const { data: githubApp, isPending } = useGithubAppQuery();

  if (isPending) {
    return (
      <div className="text-xs">
        <TextSkeleton width={16} />
      </div>
    );
  }

  return (
    <div className="border-s-4 border-green/50 ps-3 text-xs">
      <T
        id="missingRepositoryLink"
        values={{
          link: (children) => (
            <ExternalLink openInNewTab href={githubApp?.installationUrl} className="text-link">
              {children}
            </ExternalLink>
          ),
        }}
      />
    </div>
  );
}

function NoRepository({ search }: { search?: string }) {
  return (
    <div className="mx-auto col min-h-44 max-w-md items-center justify-center gap-2 text-center">
      <strong>
        <T id="noRepository.title" />
      </strong>
      <p>
        {search && <T id="noRepository.searchEmptyResults" values={{ search }} />}
        <T id="noRepository.description" />
      </p>
    </div>
  );
}

function ResynchronizeButton() {
  const t = T.useTranslate();
  const organization = useOrganization();

  const [loading, setLoading] = useState(false);

  const { mutate: resync } = useMutation({
    ...useApiMutationFn('resyncRepositories', {
      path: { organization_id: organization.id },
    }),
    onMutate() {
      setLoading(true);
      notify.info(t('synchronizingRepositories'));
    },
  });

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => setLoading(false), 10 * 1000);
      return () => clearTimeout(timeout);
    }
  });

  return (
    <Button size={2} color="gray" disabled={loading} onClick={() => resync()}>
      {loading && <Spinner className="size-4" />}
      {!loading && <IconRefreshCcw className="size-4 text-icon" />}
      <T id="refresh" />
    </Button>
  );
}

const schema = z.object({
  url: z.string().refine((url) => url.match(/.+\/.+/)),
  repositoryName: z.string().min(1),
});

function PublicRepositorySelector({ onImport }: RepositorySelectorProps) {
  const t = T.useTranslate();

  const form = useForm<z.infer<typeof schema>>({
    defaultValues: {
      url: '',
      repositoryName: '',
    },
    mode: 'onChange',
    resolver: useZodResolver(schema, (error) => {
      if (error.code === 'custom' && error.path[0] === 'url') {
        return t('publicRepository.invalidGithubRepositoryUrl');
      }
    }),
  });

  const loading = useIsMutating({ mutationKey: ['fetchPublicRepository'] }) > 0;

  return (
    <form
      className="col gap-4"
      onSubmit={handleSubmit(form, ({ repositoryName }) => onImport(repositoryName))}
    >
      <div className="col gap-2">
        <div className="font-medium">
          <T id="publicRepository.title" />
        </div>
        <div className="text-dim">
          <T id="publicRepository.description" />
        </div>
      </div>

      <div className="row items-start gap-1.5">
        <Controller
          control={form.control}
          name="url"
          render={({ field, fieldState }) => (
            <PublicGithubRepositoryInput
              size={2}
              placeholder={t('publicRepository.placeholder')}
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
              className="flex-1"
            />
          )}
        />

        <Button type="submit" size={2} color="gray" loading={loading} disabled={!form.formState.isValid}>
          <T id="import" />
        </Button>
      </div>
    </form>
  );
}
