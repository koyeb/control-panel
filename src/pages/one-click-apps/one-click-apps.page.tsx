import { Input } from '@koyeb/design-system';
import { useMemo, useState } from 'react';

import { useOneClickApps } from 'src/api/hooks/catalog';
import { OneClickApp } from 'src/api/model';
import { ExternalLink, Link } from 'src/components/link';
import { IconSearch } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { unique } from 'src/utils/arrays';

const T = createTranslate('pages.oneClickApps');

export function OneClickAppsPage() {
  const apps = useOneClickApps();

  const categories = unique(apps.flatMap((app) => app.category)).sort((category) =>
    category === 'Model' ? 1 : -1,
  );

  const section1 = apps.slice(0, 2);
  const section2 = apps.slice(2, 8);
  const section3 = apps.slice(8, 10);
  const section4 = apps.slice(10, 16);

  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  const filteredApps = useMemo(() => {
    if (search === '' && activeCategories.length === 0) {
      return null;
    }

    return apps
      .filter((app) => search === '' || app.name.toLowerCase().includes(search.toLowerCase()))
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
        <Section>
          {filteredApps.map((app) => (
            <AppItem key={app.slug} app={app} />
          ))}

          {filteredApps.length === 0 && <T id="noResults" />}
        </Section>
      )}

      {!filteredApps && (
        <>
          <Section>
            <SectionHeader title={<T id="section1" />} />
            {section1.map((app) => (
              <FeaturedApp key={app.slug} app={app} />
            ))}
          </Section>

          <Separator />

          <Section>
            <SectionHeader
              title={<T id="section2" />}
              right={
                <ExternalLink href="https://www.koyeb.com/deploy" className="text-link text-base font-medium">
                  <T id="seeAll" />
                </ExternalLink>
              }
            />
            {section2.map((app) => (
              <AppItem key={app.slug} app={app} />
            ))}
          </Section>

          <Separator />

          <Section>
            <SectionHeader title={<T id="section3" />} />
            {section3.map((app) => (
              <FeaturedApp key={app.slug} app={app} />
            ))}
          </Section>

          <Separator />

          <Section>
            <SectionHeader
              title={<T id="section4" />}
              right={
                <ExternalLink href="https://www.koyeb.com/deploy" className="text-link text-base font-medium">
                  <T id="seeAll" />
                </ExternalLink>
              }
            />
            {section4.map((app) => (
              <AppItem key={app.slug} app={app} />
            ))}
          </Section>
        </>
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

function Section({ children }: { children: React.ReactNode }) {
  return <section className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</section>;
}

function SectionHeader({ title, right }: { title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <header className="col-span-2 row justify-between gap-4">
      <h2 className="text-2xl font-medium">{title}</h2>
      {right}
    </header>
  );
}

function Separator() {
  return <hr className="mt-8 mb-12" />;
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

function AppItem({ app }: { app: OneClickApp }) {
  return (
    <div className="row items-center gap-3 px-3 py-2">
      <img src={app.logo} className="size-10 rounded-lg bg-black/80 p-1 dark:bg-transparent" />

      <div className="col min-w-0 grow gap-1">
        <div className="text-base font-medium">{app.name}</div>
        <div className="truncate text-xs text-dim">{app.description}</div>
        <div className="text-xs font-bold text-dim">{app.category}</div>
      </div>

      <Link to={`/one-click-apps/${app.slug}`} className="text-link px-2 text-xs font-medium">
        <T id="deploy" />
      </Link>
    </div>
  );
}
