import { useInfiniteQuery } from '@tanstack/react-query';
import { AnsiUp } from 'ansi_up';
import { max, sub } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { api, apiStreams } from 'src/api/api';
import { LogLine } from 'src/api/model';
import { useToken } from 'src/application/token';

import { useDeepCompareMemo } from './lifecycle';

export type LogStream = 'stdout' | 'stderr' | 'koyeb';
export type LogType = 'build' | 'runtime';

export type LogsFilters = {
  type: LogType;
  deploymentId: string;
  start: Date;
  end: Date;
};

export type LogsApi = {
  error?: Error;
  lines: LogLine[];
  loading: boolean;
  hasPrevious: boolean;
  loadPrevious: () => void;
};

export function useLogs(enabled: boolean, filters: LogsFilters): LogsApi {
  const { data: historyLines = [], ...query } = useLogsHistory(filters, enabled);
  const stream = useLogsStream({ ...filters, start: filters.end }, enabled);

  const lines = useMemo<LogLine[]>(() => {
    const ansi = new AnsiUp();

    return [...historyLines, ...stream.lines].map((line) => ({
      ...line,
      html: ansi.ansi_to_html(line.text),
    }));
  }, [historyLines, stream.lines]);

  return {
    error: query.error ?? stream.error,
    lines,
    loading: query.isFetching,
    hasPrevious: query.hasPreviousPage,
    loadPrevious: query.fetchPreviousPage,
  };
}

function useLogsHistory(filters: LogsFilters, enabled: boolean) {
  const { token } = useToken();

  return useInfiniteQuery({
    enabled,
    queryKey: ['logsQuery', filters, token],
    queryFn: ({ pageParam: { start, end } }) => {
      return api.logsQuery({
        token,
        query: {
          type: filters.type,
          deployment_id: filters.deploymentId,
          start: start.toISOString(),
          end: end.toISOString(),
          order: 'desc',
          limit: String(100),
        },
      });
    },
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    initialPageParam: {
      start: max([sub(new Date(), { days: 7 }), new Date(filters.start)]),
      end: new Date(),
    },
    getNextPageParam: () => null,
    getPreviousPageParam: (firstPage) => {
      const { has_more, next_start, next_end } = firstPage.pagination!;

      if (!has_more) {
        return null;
      }

      return {
        start: new Date(next_start!),
        end: new Date(next_end!),
      };
    },
    select: (data) => {
      return data.pages.flatMap(({ data }) =>
        data!.map((data) => getLogLine(apiLogLineSchema.parse(data))).reverse(),
      );
    },
  });
}

function useLogsStream(filters: LogsFilters, enabled: boolean) {
  const { token } = useToken();
  const filtersMemo = useDeepCompareMemo(filters);

  const stream = useRef<ReturnType<typeof tailLogs>>(null);
  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<Omit<LogLine, 'html'>[]>([]);
  const [error, setError] = useState<Error>();

  const initialize = useCallback(async () => {
    stream.current?.close();
    setLines([]);

    stream.current = tailLogs(token, filtersMemo, {
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: setError,
      onLogLine: (line) => setLines((lines) => [...lines, line]),
    });
  }, [token, filtersMemo]);

  useEffect(() => {
    if (enabled) {
      initialize().catch(console.error);
    }

    return () => {
      stream.current?.close();
    };
  }, [enabled, initialize]);

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
    },
  });

  const onOpen = () => listeners.onOpen?.();
  const onClose = () => listeners.onClose?.();
  const onError = () => listeners.onError?.(new Error('Websocket error'));

  const onMessage = (event: MessageEvent) => {
    const { success, data, error } = apiMessageSchema.safeParse(JSON.parse(event.data));

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

function getLogLine(result: z.infer<typeof apiLogLineSchema>): Omit<LogLine, 'html'> {
  return {
    id: result.created_at,
    date: new Date(result.created_at),
    stream: result.labels.stream,
    instanceId: result.labels.instance_id,
    text: result.msg,
  };
}

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
