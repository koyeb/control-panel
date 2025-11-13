import { Button } from '@koyeb/design-system';
import { useCallback, useEffect, useState } from 'react';

import { IconChevronLeft, IconChevronRight } from 'src/icons';
import { createTranslate } from 'src/intl/translate';
import { identity } from 'src/utils/generic';

import { Select } from './forms/select';

const T = createTranslate('components.pagination');

type PageSize = 10 | 25 | 50 | 100;

export function Pagination({ pagination }: { pagination: ReturnType<typeof usePagination> }) {
  return (
    <div className="row items-center justify-between gap-4">
      <div className="row items-center gap-2">
        <Button
          variant="outline"
          color="gray"
          disabled={!pagination.hasPrevious}
          onClick={pagination.previous}
        >
          <IconChevronLeft className="size-4" />
          <T id="previous" />
        </Button>

        <Button variant="outline" color="gray" disabled={!pagination.hasNext} onClick={pagination.next}>
          <T id="next" />
          <IconChevronRight className="size-4" />
        </Button>
      </div>

      <div className="row items-center gap-3">
        <T
          id="pageSize"
          values={{
            select: (
              <Select<PageSize>
                items={[10, 25, 50, 100]}
                getKey={identity}
                renderItem={identity}
                itemToString={String}
                value={pagination.pageSize}
                onChange={pagination.setPageSize}
                className="min-w-20"
              />
            ),
          }}
        />
      </div>
    </div>
  );
}

export type Pagination = ReturnType<typeof usePagination>;

// eslint-disable-next-line react-refresh/only-export-components
export function usePagination(initialPageSize: PageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hasNext, setHasNext] = useState(false);
  const hasPrevious = page > 1;

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    hasPrevious,
    hasNext,
    hasPages: hasPrevious || hasNext,
    query: {
      limit: String(pageSize),
      offset: String((page - 1) * pageSize),
    },
    previous: useCallback(() => setPage((page) => (page > 0 ? page - 1 : page)), []),
    next: useCallback(() => setPage((page) => (hasNext ? page + 1 : page)), [hasNext]),
    useSync(query?: { hasNext: boolean }) {
      useEffect(() => {
        setHasNext(Boolean(query?.hasNext));
      }, [query?.hasNext]);
    },
  };
}
