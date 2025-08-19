import { Badge } from '@koyeb/design-system';
import clsx from 'clsx';
import { lazy } from 'react';
import { FormattedDate } from 'react-intl';

import { ApiError } from 'src/api/api-errors';
import { useOneClickAppQuery, useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { SvgComponent } from 'src/application/types';
import { ExternalLink, Link, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import {
  IconCalendarDays,
  IconCircleUser,
  IconDocker,
  IconGithub,
  IconGlobe,
  IconHuggingFace,
  IconPackage,
  IconRotateCw,
  IconScale,
  IconTriangleAlert,
  IconUser,
  IconWeight,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { entries, hasProperty } from 'src/utils/object';

import { AppCard } from './app-card';

const Markdown = lazy(() => import('src/components/markdown'));

const T = createTranslate('pages.oneClickApps.details');

export function OneClickAppPage() {
  const slug = useRouteParam('slug');
  const appsQuery = useOneClickAppsQuery();
  const appQuery = useOneClickAppQuery(slug);

  if (appsQuery.isPending || appQuery.isPending) {
    return <Loading />;
  }

  if (appsQuery.isError) {
    return <QueryError error={appsQuery.error} />;
  }

  if (appQuery.isError) {
    if (ApiError.is(appQuery.error, 404)) {
      return <AppNotFound />;
    }

    return <QueryError error={appQuery.error} />;
  }

  const apps = appsQuery.data;
  const app = appQuery.data;

  const related = apps
    .filter(hasProperty('category', app.metadata.category))
    .filter((app) => app.slug !== slug);

  return (
    <div className="col gap-6">
      <Header app={app.metadata} />

      <hr />

      <AppMetadata app={app.metadata} />
      <Images app={app.metadata} />
      <AppDescription description={app.description} />

      <hr className={clsx({ hidden: related.length === 0 })} />

      <RelatedApps apps={related.slice(0, 8)} />
    </div>
  );
}

function AppNotFound() {
  const link = (children: React.ReactNode) => (
    <Link to="/one-click-apps" className="text-link font-medium">
      {children}
    </Link>
  );

  return (
    <div className="col min-h-[calc(100vh-12rem)] items-center justify-center gap-6">
      <IconTriangleAlert className="size-14 text-dim" />

      <div className="text-3xl font-medium">
        <T id="notFound.title" />
      </div>

      <div className="text-base text-dim">
        <T id="notFound.description" values={{ link }} />
      </div>
    </div>
  );
}

function Header({ app }: { app: OneClickApp }) {
  return (
    <header className="row gap-6">
      <img src={app.logo} className="size-28 rounded-lg bg-black/80 p-2 dark:bg-transparent" />

      <div className="col items-start gap-1">
        <h1 className="text-2xl font-bold">{app.name}</h1>

        <div>
          <Badge size={1} color="gray">
            {app.category}
          </Badge>
        </div>

        <div className="mt-auto">
          <LinkButton to="/one-click-apps/$slug/deploy" params={{ slug: app.slug }}>
            <T id="deploy" />
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

function AppMetadata({ app }: { app: OneClickApp }) {
  return (
    <section className="row flex-wrap items-center gap-x-6 gap-y-3">
      {entries(getAppMetadata(app)).map(([key, props]) => (
        <Metadata key={key} {...props} />
      ))}
    </section>
  );
}

function Metadata({ Icon, label, link }: { Icon: SvgComponent; label: React.ReactNode; link?: string }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <Icon className="size-em" />
      </div>

      {!link && label}

      {link && (
        <ExternalLink href={link} className="underline">
          {label}
        </ExternalLink>
      )}
    </div>
  );
}

function getAppMetadata(app: OneClickApp) {
  const metadata: Record<string, React.ComponentProps<typeof Metadata>> = {};

  if (app.projectSite) {
    metadata['website'] = {
      Icon: IconGlobe,
      label: <T id="website" />,
      link: app.projectSite,
    };
  }

  metadata['repository'] = {
    Icon: getRepositoryIcon(app.repository),
    label: <T id="repository" />,
    link: app.repository,
  };

  if (app.developer) {
    metadata['developer'] = {
      Icon: IconUser,
      label: app.developer,
    };
  }

  if (app.license) {
    metadata['license'] = {
      Icon: IconScale,
      label: app.license,
    };
  }

  metadata['createdAt'] = {
    Icon: IconCalendarDays,
    label: <FormattedDate value={app.createdAt} />,
  };

  metadata['updatedAt'] = {
    Icon: IconRotateCw,
    label: <FormattedDate value={app.updatedAt} />,
  };

  if (app.category.toLowerCase() === 'model') {
    const modelMetadata = [
      { name: 'Model developer', Icon: IconCircleUser },
      { name: 'Model family', Icon: IconPackage },
      { name: 'Model version', Icon: IconPackage },
      { name: 'Model variant', Icon: IconPackage },
      { name: 'Model size', Icon: IconWeight },
      { name: 'Model optimization', Icon: IconPackage },
      { name: 'Model api', Icon: IconPackage },
    ];

    for (const { name, Icon } of modelMetadata) {
      const data = app.metadata?.find(hasProperty('name', name));

      if (data) {
        metadata[`model_${name}`] = {
          label: `${data.name}: ${data.value}`,
          Icon,
        };
      }
    }
  }

  return metadata;
}

function getRepositoryIcon(repository: string) {
  if (repository.includes('github')) {
    return IconGithub;
  }

  if (repository.includes('docker')) {
    return IconDocker;
  }

  if (repository.includes('huggingface')) {
    return IconHuggingFace;
  }

  return () => null;
}

function Images({ app }: { app: OneClickApp }) {
  return (
    <section className="col gap-6 sm:row">
      <div>
        <img src={app.cover} className="rounded-lg" />
      </div>
      <div>
        <img src={app.cover} className="rounded-lg" />
      </div>
    </section>
  );
}

function AppDescription({ description }: { description: string }) {
  return (
    <section>
      <Markdown content={description} />
    </section>
  );
}

function RelatedApps({ apps }: { apps: OneClickApp[] }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-medium">
        <T id="related" />
      </h2>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </section>
  );
}
