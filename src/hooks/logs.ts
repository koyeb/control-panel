import { useInfiniteQuery } from '@tanstack/react-query';
import { AnsiUp } from 'ansi_up';
import { add, max, min, sub } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { api, apiStreams } from 'src/api/api';
import { useComputeDeployment } from 'src/api/hooks/service';
import { useOrganizationQuotas } from 'src/api/hooks/session';
import { LogLine } from 'src/api/model';
import { useToken } from 'src/application/token';
import { createId } from 'src/utils/strings';

import { useDeepCompareMemo } from './lifecycle';

export type LogStream = 'stdout' | 'stderr' | 'koyeb';
export type LogType = 'build' | 'runtime';

export type LogsFilters = {
  type: LogType;
  deploymentId: string;
  search?: string;
  start: Date;
  end: Date;
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
  const { data: historyLines = [], ...query } = useLogsHistory(filters);
  const stream = useLogsStream(tail, { ...filters, start: filters.end });

  const highlightSearchMatches = useCallback(
    (html: string) => {
      if (filters.search === undefined) {
        return html;
      }

      return html.replaceAll(filters.search, (value) => `<mark>${value}</mark>`);
    },
    [filters.search],
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
  const deployment = useComputeDeployment(filters.deploymentId);
  const { token } = useToken();

  const initialPageParam = useMemo(() => {
    if (!quotas || !deployment) {
      return {};
    }

    let start = filters.start;
    let end = filters.end;

    if (filters.type === 'build') {
      if (deployment.build?.startedAt) {
        start = max([start, deployment.build.startedAt]);
      }

      if (deployment.build?.finishedAt) {
        end = min([end, deployment.build.finishedAt]);
      }
    }

    if (filters.type === 'runtime') {
      start = max([start, deployment.date]);

      if (deployment.terminatedAt) {
        end = min([end, deployment.terminatedAt]);
      }
    }

    start = max([start, add(sub(new Date(), { days: quotas.logsRetention }), { minutes: 1 })]);
    end = max([start, end]);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [quotas, deployment, filters.type, filters.start, filters.end]);

  return useInfiniteQuery({
    enabled: quotas !== undefined && deployment !== undefined,
    queryKey: ['logsQuery', filters, token],
    queryFn: ({ pageParam: { start, end } }) => {
      if (start === end) {
        return { data: [], pagination: { has_more: false } };
      }

      return api.logsQuery({
        token,
        query: {
          type: filters.type,
          deployment_id: filters.deploymentId,
          start,
          end,
          text: filters.search,
          order: 'desc',
          limit: String(100),
        },
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
  const { token } = useToken();
  const filtersMemo = useDeepCompareMemo(filters);

  const stream = useRef<ReturnType<typeof tailLogs>>(null);
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<Omit<LogLine, 'html'>[]>([]);
  const [error, setError] = useState<Error>();

  const [nonce, setNonce] = useState(Math.random());
  const reconnectIndex = useRef<number>(null);

  const initialize = useCallback(() => {
    stream.current = tailLogs(token, filtersMemo, {
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
  }, [token, filtersMemo]);

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

function tailLogs(token: string | undefined, filters: LogsFilters, listeners: Partial<LogStreamListeners>) {
  const stream = apiStreams.logs({
    token,
    query: {
      type: filters.type,
      deployment_id: filters.deploymentId,
      start: filters.start.toISOString(),
      text: filters.search,
    },
  });

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
