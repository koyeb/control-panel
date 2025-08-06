import { Input } from '@koyeb/design-system';
import { useMemo, useState } from 'react';

import { useOneClickApps } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { Link } from 'src/components/link';
import { IconSearch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { unique } from 'src/utils/arrays';
import { lowerCase } from 'src/utils/strings';

import { AppCard } from './app-card';

const T = createTranslate('pages.oneClickApps.list');

export function OneClickAppsPage() {
  const apps = useOneClickApps();

  const categories = unique(apps.flatMap((app) => app.category)).sort((category) =>
    category === 'Model' ? 1 : -1,
  );

  const models = apps.filter((app) => app.category.toLowerCase() === 'model');

  const officialModels = models.filter((app) =>
    // cspell:disable-next-line
    ['deepseek-r1-llama-8b', 'mistral-small-3-instruct'].includes(app.slug),
  );

  const others = apps.filter((app) => app.category.toLocaleLowerCase() !== 'model');

  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const filteredApps = useMemo(() => {
    if (search === '' && activeCategories.length === 0) {
      return null;
    }

    return apps
      .filter((app) => search === '' || lowerCase(app.name).includes(lowerCase(search)))
      .filter((app) => activeCategories.length === 0 || activeCategories.includes(app.category));
  }, [apps, search, activeCategories]);

  return (
    <>
      <Header />

      <Filters
        search={search}
        setSearch={setSearch}
        categories={categories}
        activeCategories={activeCategories}
        setActiveCategories={setActiveCategories}
      />

      {filteredApps && (
        <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredApps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}

          {filteredApps.length === 0 && <T id="noResults" />}
        </section>
      )}

      {!filteredApps && (
        <div className="col gap-8">
          <section className="grid grid-cols-2 gap-x-6 gap-y-4">
            <SectionHeader title={<T id="officialModels" />} />
            {officialModels.map((app) => (
              <FeaturedApp key={app.slug} app={app} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <SectionHeader
              title={<T id="models" />}
              right={
                <Link
                  to="/one-click-apps/category/$category"
                  params={{ category: 'Model' }}
                  className="text-link text-base font-medium"
                >
                  <T id="seeAll" />
                </Link>
              }
            />
            {models.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <SectionHeader title={<T id="others" />} />
            {others.map((app) => (
              <AppCard key={app.slug} app={app} />
            ))}
          </section>
        </div>
      )}
    </>
  );
}

function Header() {
  return (
    <div className="mx-auto mt-14 mb-11 col max-w-2xl gap-4 text-center">
      <h1 className="text-4xl font-bold uppercase">
        <T id="title" />
      </h1>
      <div className="text-base text-dim">
        <T id="description" />
      </div>
    </div>
  );
}

type FiltersProps = {
  search: string;
  setSearch: (search: string) => void;
  categories: string[];
  activeCategories: string[];
  setActiveCategories: (categories: string[]) => void;
};

function Filters({ search, setSearch, categories, activeCategories, setActiveCategories }: FiltersProps) {
  const t = T.useTranslate();

  const toggleCategory = (category: string) => {
    return activeCategories.includes(category)
      ? activeCategories.filter((cat) => cat !== category)
      : [...activeCategories, category];
  };

  return (
    <div className="mb-10 col items-center gap-4">
      <Input
        type="search"
        size={3}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('search.placeholder')}
        end={
          <div className="mx-2 row items-center text-dim">
            <IconSearch className="size-4" />
          </div>
        }
        className="w-full max-w-2xl"
      />

      <div className="row items-center gap-3">
        {categories.map((category) => (
          <button
            key={category}
            data-active={activeCategories.includes(category) || undefined}
            onClick={() => setActiveCategories(toggleCategory(category))}
            className="rounded-full border px-3 py-1.5 font-medium transition-colors hover:bg-muted data-active:border-transparent data-active:bg-green data-active:text-white"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="col-span-full row justify-between gap-4">
      <h2 className="text-2xl font-medium">{title}</h2>
      {right}
    </header>
  );
}

function FeaturedApp({ app }: { app: OneClickApp }) {
  return (
    <Link to={`/one-click-apps/${app.slug}`} className="col gap-2">
      <img src={app.cover} className="max-h-[16rem] w-full rounded-xl object-cover" />
      <div className="text-xs font-bold text-dim">{app.category}</div>
      <div className="text-xl font-medium">{app.name}</div>
      <div className="truncate text-dim">{app.description}</div>
    </Link>
  );
}
