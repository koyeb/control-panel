import { Badge } from '@koyeb/design-system';
import clsx from 'clsx';
import { FormattedDate } from 'react-intl';

import { useOneClickAppsQuery } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { SvgComponent } from 'src/application/types';
import { ExternalLink, LinkButton } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { useRouteParam } from 'src/hooks/router';
import {
  IconDocker,
  IconGithub,
  IconGlobe,
  IconPackage,
  IconPen,
  IconPlus,
  IconRocket,
  IconScale,
  IconUser,
} from 'src/icons';
import IconHuggingFace from 'src/icons/huggingface.svg?react';
import { createTranslate } from 'src/intl/translate';
import { entries, hasProperty } from 'src/utils/object';

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
      <img src={app.logo} className="size-6 rounded-md bg-black/80 p-1 dark:bg-transparent" />

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

  metadata['category'] = {
    Icon: IconRocket,
    label: app.category,
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
    Icon: IconPlus,
    label: <FormattedDate value={app.createdAt} />,
  };

  metadata['updatedAt'] = {
    Icon: IconPen,
    label: <FormattedDate value={app.updatedAt} />,
  };

  if (app.category.toLowerCase() === 'model') {
    const modelMetadata = [
      { name: 'Model developer', Icon: IconPackage },
      { name: 'Model family', Icon: IconPackage },
      { name: 'Model version', Icon: IconPackage },
      { name: 'Model variant', Icon: IconPackage },
      { name: 'Model size', Icon: IconPackage },
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
