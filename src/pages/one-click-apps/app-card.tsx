import { Badge } from '@koyeb/design-system';

import { OneClickApp } from 'src/api/model';
import { Link } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.oneClickApps.card');

export function AppCard({ app }: { app: OneClickApp }) {
  return (
    <div className="relative">
      <Link
        to="/one-click-apps/$slug/deploy"
        params={{ slug: app.slug }}
        className="absolute top-3 right-3 text-link pt-1 font-medium"
      >
        <T id="deploy" />
      </Link>

      <Link
        to="/one-click-apps/$slug"
        params={{ slug: app.slug }}
        className="col gap-2 rounded-md border p-3 transition-colors hover:bg-muted/50"
      >
        <div className="row items-center justify-between">
          <img src={app.logo} className="size-6 rounded-md bg-black/80 p-1 dark:bg-transparent" />
        </div>

        <div className="col gap-1">
          <div className="text-base">{app.name}</div>
          <div className="line-clamp-2 text-xs text-dim">{app.description}</div>
        </div>

        <div>
          <Badge size={1} color="gray">
            {app.category}
          </Badge>
        </div>
      </Link>
    </div>
  );
}
