import { Spinner } from '@koyeb/design-system';
import { UseInfiniteQueryResult, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';

import { getApiQueryKey, mapActivity, useApi } from 'src/api';
import { ApiEndpoint } from 'src/api/api';
import { DocumentTitle } from 'src/components/document-title';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { Title } from 'src/components/title';
import { useMount } from 'src/hooks/lifecycle';
import { useIntersectionObserver } from 'src/hooks/observers';
import { useSearchParams } from 'src/hooks/router';
import { createTranslate } from 'src/intl/translate';
import { Activity } from 'src/model';
import { ActivityIcon } from 'src/modules/activity/activity-icon';
import { ActivityItem } from 'src/modules/activity/activity-item';
import { createArray } from 'src/utils/arrays';

const T = createTranslate('pages.activity');

const pageSize = 20;

const allTypes = [
  'session',
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
];

export function ActivityPage() {
  const t = T.useTranslate();

  const api = useApi();
  const queryClient = useQueryClient();

  const params = useSearchParams();
  const types = params.has('types') ? params.getAll('types') : allTypes;

  const query = useInfiniteQuery({
    queryKey: getApiQueryKey('get /v1/activities', { query: { types } }),
    async queryFn({ pageParam }) {
      return api('get /v1/activities', {
        query: {
          offset: String(pageParam * pageSize),
          limit: String(pageSize),
          types,
        },
      }).then(({ activities }) => activities!.map(mapActivity));
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: Activity[], pages, lastPageParam) => {
      if (lastPage.length === pageSize) {
        return lastPageParam + 1;
      }

      return null;
    },
  });

  const setInfiniteScrollElementRef = useInfiniteScroll(query);

  useMount(() => {
    return () => queryClient.removeQueries({ queryKey: ['get /v1/activities' satisfies ApiEndpoint] });
  });

  if (query.isError) {
    return <QueryError error={query.error} />;
  }

  return (
    <>
      <DocumentTitle title={t('documentTitle')} />

      <Title title={<T id="title" />} />

      <div className="col">
        {query.isPending && (
          <Loading>
            <ActivitySkeleton />
          </Loading>
        )}

        {query.isSuccess && <ActivityList activities={query.data.pages.flat()} />}

        <div ref={setInfiniteScrollElementRef} className="row justify-center py-4">
          {query.isFetchingNextPage && <Spinner className="size-4" />}
        </div>
      </div>
    </>
  );
}

function useInfiniteScroll(query: UseInfiniteQueryResult) {
  const { error, hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  return useIntersectionObserver(
    ([entry]) => {
      if (entry?.intersectionRatio === 0) {
        return;
      }

      if (!error && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    },
    undefined,
    [error, hasNextPage, isFetchingNextPage, fetchNextPage],
  );
}

function ActivitySkeleton() {
  return (
    <>
      {createArray(10, null).map((_, index) => (
        <div key={index} className="row gap-3">
          <div className="col items-center">
            <div className={clsx('flex-1', index > 0 && 'border-l')} />
            <div>
              <div className={clsx('rounded-full border p-1.5')}>
                <div className={clsx('size-3.5')} />
              </div>
            </div>
            <div className={clsx('flex-1', index < 10 - 1 && 'border-l')} />
          </div>

          <span className="my-3 col flex-1 gap-2 rounded-lg border p-3">
            <TextSkeleton width={20} />
            <TextSkeleton width={12} />
          </span>
        </div>
      ))}
    </>
  );
}

function ActivityList({ activities }: { activities: Activity[] }) {
  return (
    <>
      {activities.map((activity, index) => (
        <div key={activity.id} className="row gap-3">
          <div className="col items-center">
            <div className={clsx('flex-1', index > 0 && 'border-l')} />
            <div>
              <ActivityIcon activity={activity} />
            </div>
            <div className={clsx('flex-1', index < activities.length - 1 && 'border-l')} />
          </div>

          <ActivityItem activity={activity} className="my-3 flex-1 rounded-lg border p-3" />
        </div>
      ))}
    </>
  );
}
