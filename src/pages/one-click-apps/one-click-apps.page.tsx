import groupBy from 'lodash-es/groupBy';
import { useEffect } from 'react';

import { Tab, Tabs } from '@koyeb/design-system';
import { useOneClickApps } from 'src/api/hooks/catalog';
import { Link, LinkButton } from 'src/components/link';
import { useSearchParam } from 'src/hooks/router';

export function OneClickAppsPage() {
  const apps = useOneClickApps();

  const byCategory = groupBy(apps, (app) => app.category);
  const categories = Object.keys(byCategory);

  const [selectedCategory, setSelectedCategory] = useSearchParam('category');

  useEffect(() => {
    if (selectedCategory === null && categories[0] !== undefined) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory, setSelectedCategory]);

  return (
    <>
      <Tabs className="mb-8">
        {Object.keys(byCategory).map((category) => (
          <Tab
            key={category}
            component={Link}
            selected={category === selectedCategory}
            href={`?category=${category}`}
          >
            {category}
          </Tab>
        ))}
      </Tabs>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {byCategory[selectedCategory ?? '']?.map((app) => (
          <li key={app.slug} className="col gap-4 rounded-lg border p-4">
            <div className="row items-center gap-3">
              <img src={app.logo} className="size-8 rounded bg-black/75 p-1" />
              <div className="text-lg font-medium">{app.name}</div>
            </div>

            <p className="line-clamp-3 text-dim">{app.description}</p>

            <div className="row mt-auto justify-end">
              <LinkButton variant="ghost" color="gray" href={app.deployUrl}>
                Deploy
              </LinkButton>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
