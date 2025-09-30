import { useInfiniteQuery } from '@tanstack/react-query';
import { AnsiUp } from 'ansi_up';
import { add, max, sub } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { apiStream, getApiQueryKey } from 'src/api/api';
import { useOrganizationQuotas } from 'src/api/hooks/session';
import { LogLine } from 'src/api/model';
import { getConfig } from 'src/application/config';
import { getApi } from 'src/application/container';
import { getToken } from 'src/application/token';
import { createId } from 'src/utils/strings';

import { useDeepCompareMemo } from './lifecycle';
import { useDebouncedValue } from './timers';

export type LogType = 'build' | 'runtime';
export type LogStream = 'stdout' | 'stderr' | 'koyeb';
export type LogsPeriod = 'live' | '1h' | '6h' | '24h' | '7d' | '30d';

export type LogsFilters = {
  type: LogType;
  deploymentId: string;
  regionalDeploymentId: string | null;
  instanceId: string | null;
  period: LogsPeriod;
  start: Date;
  end: Date;
  search: string;
  logs: boolean;
  events: boolean;
};

export type LogsApi = {
  error?: Error;
  lines: LogLine[];
  loading: boolean;
  fetching: boolean;
  hasPrevious: boolean;
  loadPrevious: () => void;
};

export function useLogs(tail: boolean, filters: LogsFilters): LogsApi {
  const filtersMemo = useDeepCompareMemo({ ...filters, search: useDebouncedValue(filters.search, 500) });

  const { data: historyLines = [], ...query } = useLogsHistory(filtersMemo);
  const stream = useLogsStream(tail, filtersMemo);

  const { search } = filtersMemo;
  const highlightSearchMatches = useCallback(
    (html: string) => {
      if (search === '') {
        return html;
      }

      return html.replaceAll(search, (value) => `<mark>${value}</mark>`);
    },
    [search],
  );

  const lines = useMemo<LogLine[]>(() => {
    const ansi = new AnsiUp();

    return [...historyLines, ...stream.lines].map((line) => ({
      ...line,
      html: highlightSearchMatches(ansi.ansi_to_html(line.text)),
    }));
  }, [historyLines, stream.lines, highlightSearchMatches]);

  return {
    error: query.error ?? stream.error,
    lines,
    loading: query.isLoading,
    fetching: query.isFetching,
    hasPrevious: query.hasPreviousPage,
    loadPrevious: () => !query.isFetching && void query.fetchPreviousPage(),
  };
}

function useLogsHistory(filters: LogsFilters) {
  const quotas = useOrganizationQuotas();

  const initialPageParam = useMemo(() => {
    const start = max([filters.start, add(sub(new Date(), { days: quotas.logsRetention }), { minutes: 1 })]);
    const end = max([start, filters.end]);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [quotas, filters.start, filters.end]);

  return useInfiniteQuery({
    queryKey: getApiQueryKey('get /v1/streams/logs/tail', {
      query: {
        type: filters.type,
        deployment_id: filters.deploymentId,
        regional_deployment_id: filters.regionalDeploymentId ?? undefined,
        instance_id: filters.instanceId ?? undefined,
        text: filters.search || undefined,
        limit: String(100),
        ...initialPageParam,
      },
    }),
    queryFn: ({ queryKey: [, { query }], pageParam: { start, end } }) => {
      const api = getApi();

      if (start === end) {
        return { data: [], pagination: { has_more: false } };
      }

      return api('get /v1/streams/logs/query', {
        query: { ...query, start, end },
      });
    },
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    initialPageParam,
    getNextPageParam: () => null,
    getPreviousPageParam: (firstPage) => {
      const { has_more, next_start, next_end } = firstPage.pagination!;

      if (!has_more) {
        return null;
      }

      return {
        start: next_start!,
        end: next_end!,
      };
    },
    select: (data) => {
      return data.pages.flatMap(({ data }) =>
        data!.map((data) => getLogLine(data as unknown as ApiLogLine)).reverse(),
      );
    },
  });
}

const reconnectTimeout = [0, 1_000, 5_000, 60_000];

function useLogsStream(connect: boolean, filters: LogsFilters) {
  const filtersMemo = useDeepCompareMemo(filters);

  const stream = useRef<ReturnType<typeof tailLogs>>(null);
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<Omit<LogLine, 'html'>[]>([]);
  const [error, setError] = useState<Error>();

  const [nonce, setNonce] = useState(Math.random());
  const reconnectIndex = useRef<number>(null);

  const initialize = useCallback(() => {
    const filters = {
      ...filtersMemo,
      start: filtersMemo.end,
    };

    stream.current = tailLogs(filters, {
      onOpen: () => {
        setError(undefined);
        setConnected(true);
        reconnectIndex.current = null;
      },
      onClose: () => {
        setConnected(false);
        setNonce(Math.random());
      },
      onError: (error) => {
        setError(error);
        setNonce(Math.random());
        reconnectIndex.current ??= 0;
        reconnectIndex.current++;
      },
      onLogLine: (line) => setLines((lines) => [...lines, line]),
    });
  }, [filtersMemo]);

  useEffect(() => {
    let timeout: number;

    if (connect) {
      timeout = window.setTimeout(initialize, reconnectTimeout[reconnectIndex.current ?? 0]);
    }

    return () => {
      window.clearTimeout(timeout);
      stream.current?.close();
      setLines([]);
    };
  }, [connect, initialize, nonce]);

  return {
    connected,
    error,
    lines,
  };
}

type LogStreamListeners = {
  onOpen: () => void;
  onClose: () => void;
  onError: (error: Error) => void;
  onLogLine: (line: Omit<LogLine, 'html'>) => void;
};

function tailLogs(filters: LogsFilters, listeners: Partial<LogStreamListeners>) {
  const stream = apiStream(
    'get /v1/streams/logs/tail',
    {
      query: {
        type: filters.type,
        deployment_id: filters.deploymentId,
        regional_deployment_id: filters.regionalDeploymentId ?? undefined,
        instance_id: filters.instanceId ?? undefined,
        start: filters.start.toISOString(),
        text: filters.search || undefined,
      },
    },
    {
      baseUrl: getConfig('apiBaseUrl'),
      token: getToken(),
    },
  );

  const onOpen = () => listeners.onOpen?.();
  const onClose = () => listeners.onClose?.();
  const onError = () => listeners.onError?.(new Error('Websocket error'));

  const onMessage = (event: MessageEvent) => {
    const { success, data, error } = apiMessageSchema.safeParse(JSON.parse(event.data as string));

    if (!success) {
      listeners.onError?.(error);
    } else if ('error' in data) {
      listeners.onError?.(new Error(data.error.message));
    } else {
      listeners.onLogLine?.(getLogLine(data.result));
    }
  };

  stream.addEventListener('open', onOpen);
  stream.addEventListener('close', onClose);
  stream.addEventListener('error', onError);
  stream.addEventListener('message', onMessage);

  return {
    close() {
      stream.close();
      stream.removeEventListener('open', onOpen);
      stream.removeEventListener('close', onClose);
      stream.removeEventListener('error', onError);
      stream.removeEventListener('message', onMessage);
    },
  };
}

function getLogLine(result: ApiLogLine): Omit<LogLine, 'html'> {
  return {
    id: createId(),
    date: new Date(result.created_at),
    stream: result.labels.stream,
    instanceId: result.labels.instance_id,
    text: result.msg,
  };
}

type ApiLogLine = z.infer<typeof apiLogLineSchema>;

const apiLogLineSchema = z.object({
  created_at: z.string(),
  labels: z.object({
    stream: z.union([z.literal('stdout'), z.literal('stderr'), z.literal('koyeb')]),
    instance_id: z.string().optional(),
  }),
  msg: z.string(),
});

const apiMessageSchema = z.union([
  z.object({ result: apiLogLineSchema }),
  z.object({ error: z.object({ message: z.string() }) }),
]);
