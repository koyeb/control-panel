import { Spinner } from '@koyeb/design-system';
import { UseInfiniteQueryResult, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';
import { useState } from 'react';

import { getApiQueryKey, mapActivity, useApi } from 'src/api';
import { ApiEndpoint } from 'src/api/api';
import { DocumentTitle } from 'src/components/document-title';
import { MultiSelectMenu, Select, multiSelectStateReducer } from 'src/components/forms';
import { Loading } from 'src/components/loading';
import { QueryError } from 'src/components/query-error';
import { TextSkeleton } from 'src/components/skeleton';
import { Title } from 'src/components/title';
import { FeatureFlag } from 'src/hooks/feature-flag';
import { useMount } from 'src/hooks/lifecycle';
import { useIntersectionObserver } from 'src/hooks/observers';
import { IconCheck } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { CrumbLink } from 'src/layouts/main/app-breadcrumbs';
import { Activity } from 'src/model';
import { ActivityIcon } from 'src/modules/activity/activity-icon';
import { ActivityItem } from 'src/modules/activity/activity-item';
import { arrayToggle, createArray } from 'src/utils/arrays';
import { identity } from 'src/utils/generic';

export const Route = createFileRoute('/_main/activity')({
  component: ActivityPage,

  beforeLoad: () => ({
    breadcrumb: () => <CrumbLink to={Route.to} />,
  }),
});

const T = createTranslate('pages.activity');

const pageSize = 20;

const allTypes = [
  'app',
  'credential',
  'deployment',
  'domain',
  'organization_invitation',
  'organization_member',
  'organization',
  'persistent_volume',
  'secret',
  'service',
  'session',
  'subscription',
  'user',
];

function ActivityPage() {
  const t = T.useTranslate();

  const api = useApi();
  const queryClient = useQueryClient();

  const [types, setTypes] = useState(allTypes.filter((type) => type !== 'session'));

  const query = useInfiniteQuery({
    queryKey: getApiQueryKey('get /v1/activities', { query: { types } }, api),
    async queryFn({ pageParam }) {
      if (types.length === 0) {
        return [];
      }

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

      <Title
        title={<T id="title" />}
        end={
          <FeatureFlag feature="activities-filter">
            <ActivityTypesSelector types={types} setTypes={setTypes} />
          </FeatureFlag>
        }
      />

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

type ActivityTypesSelectorProps = {
  types: string[];
  setTypes: (types: string[]) => void;
};

function ActivityTypesSelector({ types, setTypes }: ActivityTypesSelectorProps) {
  return (
    <Select
      items={allTypes}
      onChange={(type) => setTypes(arrayToggle(types, type))}
      select={{ stateReducer: multiSelectStateReducer }}
      value={null}
      renderValue={() => <T id="types" values={{ count: types.length }} />}
      menu={(context) => (
        <MultiSelectMenu
          context={context}
          items={allTypes}
          selected={types}
          getKey={identity}
          onClearAll={() => setTypes([])}
          onSelectAll={() => setTypes(allTypes)}
          renderItem={(type, selected) => (
            <div className="row items-center justify-between gap-4 px-3 py-1.5">
              <div className="grow capitalize">{type.replaceAll('_', ' ')}</div>
              {selected && <IconCheck className="size-4 text-green" />}
            </div>
          )}
        />
      )}
      className="min-w-64"
    />
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
  if (activities.length === 0) {
    return (
      <div className="mt-4 row min-h-48 items-center justify-center rounded-sm border text-dim">
        <T id="empty" />
      </div>
    );
  }

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
