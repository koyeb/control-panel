import { UseInfiniteQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { useIntersectionObserver } from 'src/hooks/intersection-observer';

export function useInfiniteScroll(query: UseInfiniteQueryResult) {
  const { error, hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const [elementRef, setElementRef] = useState<HTMLElement | null>(null);

  useIntersectionObserver(
    elementRef,
    useMemo(() => ({ root: null }), []),
    useCallback(
      (entry) => {
        if (entry.intersectionRatio === 0) {
          return;
        }

        if (!error && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      [error, hasNextPage, isFetchingNextPage, fetchNextPage],
    ),
  );

  return setElementRef;
}
