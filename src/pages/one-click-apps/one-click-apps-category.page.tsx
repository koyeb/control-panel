import { useOneClickApps } from 'src/api/hooks/catalog';
import { useRouteParam } from 'src/hooks/router';
import { hasProperty } from 'src/utils/object';

import { AppCard } from './app-card';

export function OneClickAppsCategoryPage() {
  const category = useRouteParam('category');
  const apps = useOneClickApps().filter(hasProperty('category', category));

  return (
    <div className="col gap-6">
      <h1 className="text-4xl font-medium">{category}</h1>

      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {apps.map((app) => (
          <AppCard key={app.slug} app={app} />
        ))}
      </div>
    </div>
  );
}
