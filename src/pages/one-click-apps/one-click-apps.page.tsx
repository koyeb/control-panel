import { Input, InputStart } from '@koyeb/design-system';

import { useOneClickApps } from 'src/api/hooks/catalog';
import { LinkButton } from 'src/components/link';
import { useNavigate, useSearchParams } from 'src/hooks/router';
import { IconSearch } from 'src/icons';

export function OneClickAppsPage() {
  const apps = useOneClickApps();

  const search = useSearchParams().get('search')?.toLowerCase() ?? '';
  const navigate = useNavigate();

  return (
    <div className="col gap-6">
      <Input
        value={search}
        onChange={(event) =>
          navigate({ search: (prev) => ({ ...prev, search: event.target.value || null }) })
        }
        placeholder="Search..."
        start={
          <InputStart>
            <IconSearch className="size-4" />
          </InputStart>
        }
      />

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {apps
          .filter((app) => app.slug.includes(search))
          ?.map((app) => (
            <li key={app.slug} className="col gap-4 rounded-lg border p-4">
              <div className="row items-center gap-3">
                <img src={app.logo} className="size-8 rounded bg-black/75 p-1" />
                <div className="text-lg font-medium">{app.name}</div>
              </div>

              <p className="line-clamp-3 text-dim">{app.description}</p>

              <div className="mt-auto row justify-end">
                <LinkButton variant="ghost" color="gray" to={app.deployUrl}>
                  Deploy
                </LinkButton>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}
