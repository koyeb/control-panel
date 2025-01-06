import { useQuery } from '@tanstack/react-query';

import { mapActivities } from 'src/api/mappers/activity';
import { useApiQueryFn } from 'src/api/use-api';
import { routes } from 'src/application/routes';
import { Link } from 'src/components/link';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { createTranslate } from 'src/intl/translate';

import { ActivityItem } from './activity-item';

const T = createTranslate('pages.home.activity');

export function Activities() {
  return (
    <div className="xl:col hidden gap-3">
      <div className="row items-center justify-between gap-4">
        <span className="text-lg font-medium">
          <T id="title" />
        </span>
        <Link className="text-link" href={routes.activity()}>
          <T id="viewAll" />
        </Link>
      </div>

      <div className="rounded-lg border">
        <ActivityList />
      </div>
    </div>
  );
}

function ActivityList() {
  const limit = 5;

  const query = useQuery({
    ...useApiQueryFn('listActivities', {
      query: {
        limit: String(limit),
        types: [
          'secret',
          'deployment',
          'domain',
          'service',
          'subscription',
          'user',
          'app',
          'credential',
          'organization_member',
          'organization_invitation',
          'organization',
        ],
      },
    }),
    select: mapActivities,
  });

  if (query.isPending) {
    return <Loading />;
  }

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  const activities = query.data;

  return (
    <>
      {activities.map((activity, index) => (
        <ActivityItem key={activity.id} activity={activity} isLast={index === activities.length - 1} />
      ))}
    </>
  );
}
