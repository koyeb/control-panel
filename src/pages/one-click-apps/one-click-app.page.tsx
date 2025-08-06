import { Badge } from '@koyeb/design-system';
import clsx from 'clsx';

import { useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { SvgComponent } from 'src/application/types';
import { ExternalLink, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import { IconCode, IconDocker, IconDownload, IconGithub, IconGlobe, IconRocket, IconWeight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { hasProperty } from 'src/utils/object';

import { AppCard } from './app-card';

const T = createTranslate('pages.oneClickApps.details');

export function OneClickAppPage() {
  const slug = useRouteParam('slug');
  const query = useOneClickAppsQuery();

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  const apps = query.data;
  const app = apps.find((app) => app.slug === slug);
  const related = apps.filter(hasProperty('category', app?.category)).filter(not(eq(app)));

  if (app === undefined) {
    // to do
    return <>App not found</>;
  }

  return (
    <div className="col gap-6">
      <Header app={app} />

      <hr />

      <AppMetadata app={app} />
      <Images app={app} />
      <AppDescription app={app} />

      <hr className={clsx({ hidden: related.length === 0 })} />

      <RelatedApps apps={related.slice(0, 8)} />
    </div>
  );
}

function not<Args extends unknown[]>(predicate: (...args: Args) => boolean) {
  return (...args: Args) => !predicate(...args);
}

function eq<T>(a: T) {
  return (b: T) => a === b;
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
    <section className="row items-center gap-6">
      {app.projectSite && (
        <Metadata
          Icon={IconGlobe}
          label={
            <ExternalLink href={app.projectSite} className="underline">
              <T id="website" />
            </ExternalLink>
          }
        />
      )}

      <Metadata
        Icon={app.repository.includes('github') ? IconGithub : IconDocker}
        label={
          <ExternalLink href={app.repository} className="underline">
            <T id="repository" />
          </ExternalLink>
        }
      />

      <Metadata Icon={IconRocket} label={app.category} />

      {app.modelSize && <Metadata Icon={IconWeight} label={app.modelSize} />}

      <Metadata Icon={IconDownload} label={'1.3 K'} />

      {app.developer && <Metadata Icon={IconCode} label={app.developer} />}
    </section>
  );
}

function Metadata({ Icon, label }: { Icon: SvgComponent; label: React.ReactNode }) {
  return (
    <div className="row items-center gap-2">
      <div>
        <Icon className="size-em" />
      </div>

      {label}
    </div>
  );
}

function Images({ app }: { app: OneClickApp }) {
  return (
    <section className="row gap-6">
      <div>
        <img src={app.cover} className="rounded-lg" />
      </div>
      <div>
        <img src={app.cover} className="rounded-lg" />
      </div>
    </section>
  );
}

function AppDescription({ app }: { app: OneClickApp }) {
  return (
    <section className="col gap-2">
      <h2 className="text-xl font-medium">
        <T id="overview" />
      </h2>
      <p className="text-dim">{app.description}</p>
    </section>
  );
}

function RelatedApps({ apps }: { apps: OneClickApp[] }) {
  return (
    <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {apps.map((app) => (
        <AppCard key={app.slug} app={app} />
      ))}
    </section>
  );
}
