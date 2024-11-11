import { useQuery } from '@tanstack/react-query';

import { mapServicesSummary } from '../mappers/summary';
import { useApiQueryFn } from '../use-api';

export function useServicesSummaryQuery() {
  return useQuery({
    ...useApiQueryFn('getServicesSummary', {
      query: {
        by_type: true,
        by_status: true,
      },
    }),
    select: mapServicesSummary,
  });
}

export function useServicesSummary() {
  return useServicesSummaryQuery().data;
}
