import { Badge } from '@koyeb/design-system';
import clsx from 'clsx';
import { lazy } from 'react';

import { ApiError, useOneClickAppQuery, useOneClickAppsQuery } from 'src/api';
import { SvgComponent } from 'src/application/types';
import { ExternalLink, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { Metadata } from 'src/components/metadata';
import { QueryError } from 'src/components/query-error';
import {
  IconCircleUser,
  IconDocker,
  IconGithub,
  IconGlobe,
  IconHuggingFace,
  IconRocket,
  IconRotateCw,
  IconScale,
  IconUser,
  IconWeight,
} from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { OneClickApp, OneClickAppMetadata } from 'src/model';
import { hasProperty } from 'src/utils/object';

import { AppCard } from './app-card';
import { AppNotFound } from './app-not-found';

const Markdown = lazy(() => import('src/components/markdown'));

const T = createTranslate('pages.oneClickApps.details');

export function OneClickAppPage({ slug }: { slug: string }) {
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

      <hr />

      <AppDescription description={app.description} />

      <hr className={clsx({ hidden: related.length === 0 })} />

      <RelatedApps apps={related.slice(0, 8)} />
    </div>
  );
}

function Header({ app }: { app: OneClickApp }) {
  return (
    <header className="row gap-6">
      <img src={app.logo} className="size-28 rounded-lg bg-black/80 p-2 dark:bg-transparent" />

      <div className="col items-start gap-1">
        <div className="row items-center gap-2">
          <h1 className="text-2xl font-bold">{app.name}</h1>

          <div>
            <Badge size={1} color="gray">
              {app.category}
            </Badge>
          </div>
        </div>

        <p className="text-dim">{app.description}</p>

        <div className="mt-auto">
          <LinkButton to="/one-clicks/$slug/deploy" params={{ slug: app.slug }}>
            <T id="deploy" />
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

function AppMetadata({ app }: { app: OneClickApp }) {
  return (
    <section className="row flex-wrap items-center gap-x-8 gap-y-3">
      {app.metadata.map((metadata, index) => (
        <Metadata key={index} label={metadata.name} value={<MetadataValue metadata={metadata} />} />
      ))}
    </section>
  );
}

function MetadataValue({ metadata }: { metadata: OneClickAppMetadata }) {
  const Icon = metadata.icon && metadataIconMap[metadata.icon];

  const icon = Icon && (
    <div>
      <Icon className="size-4" />
    </div>
  );

  const value = <div className="max-w-64 truncate">{metadata.value}</div>;

  if (metadata.href) {
    return (
      <ExternalLink href={metadata.href} className="row items-center gap-1 underline">
        {icon}
        {value}
      </ExternalLink>
    );
  }

  return (
    <div className="row items-center gap-1">
      {icon}
      {value}
    </div>
  );
}

const metadataIconMap: Record<string, SvgComponent> = {
  rotate: IconRotateCw,
  globe: IconGlobe,
  rocket: IconRocket,
  weight: IconWeight,
  scale: IconScale,
  user: IconUser,
  'circle-user': IconCircleUser,
  github: IconGithub,
  docker: IconDocker,
  huggingface: IconHuggingFace,
};

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
