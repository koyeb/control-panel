import { useMemo, useState } from 'react';

import { useOneClickApps } from 'src/api';
import { Input } from 'src/components/forms/input';
import { IconSearch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { OneClickApp } from 'src/model';
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
  const others = apps.filter((app) => app.category.toLocaleLowerCase() !== 'model');

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredApps = useMemo(() => {
    if (search === '' && activeCategory === null) {
      return null;
    }

    const query = lowerCase(search);

    const matchSearch = (app: OneClickApp) => {
      return [
        query === '',
        lowerCase(app.name).includes(query),
        lowerCase(app.description).includes(query),
        lowerCase(app.category).includes(query),
      ].some(Boolean);
    };

    const matchCategory = (app: OneClickApp) => {
      return activeCategory === null || app.category === activeCategory;
    };

    return apps.filter(matchSearch).filter(matchCategory);
  }, [apps, search, activeCategory]);

  return (
    <>
      <Header />

      <Filters
        search={search}
        setSearch={setSearch}
        categories={categories}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />

      {filteredApps && (
        <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredApps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}

          {filteredApps.length === 0 && <NoSearchResults />}
        </section>
      )}

      {!filteredApps && (
        <div className="col gap-8">
          <section className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <SectionHeader
              title={<T id="models" />}
              right={
                <button
                  onClick={() => setActiveCategory('Model')}
                  className="text-link text-base font-medium"
                >
                  <T id="seeAll" />
                </button>
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
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
};

function Filters({ search, setSearch, categories, activeCategory, setActiveCategory }: FiltersProps) {
  const t = T.useTranslate();

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

      <div className="flex-wrap row items-center gap-3">
        {categories.map((category) => (
          <button
            key={category}
            data-active={category === activeCategory || undefined}
            onClick={() => setActiveCategory(category === activeCategory ? null : category)}
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

function NoSearchResults() {
  return (
    <div className="col-span-full col min-h-48 items-center justify-center gap-6">
      <IconSearch className="size-14 text-dim" />
      <div className="text-3xl font-medium">
        <T id="noResults" />
      </div>
    </div>
  );
}
