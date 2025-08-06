import { Badge } from '@koyeb/design-system';

import { OneClickApp } from 'src/api/model';
import { LinkButton } from 'src/components/link';
import { createTranslate } from 'src/intl/translate';

const T = createTranslate('pages.oneClickApps.card');

export function AppCard({ app }: { app: OneClickApp }) {
  return (
    <div className="col gap-2 rounded-md border p-3">
      <div className="row justify-between">
        <img src={app.logo} className="size-6 rounded-md bg-black/80 p-1 dark:bg-transparent" />

        <LinkButton to="/one-click-apps/$slug" params={{ slug: app.slug }} variant="ghost" color="green">
          <T id="deploy" />
        </LinkButton>
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
    </div>
  );
}
