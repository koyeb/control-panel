import {
  QueryKey,
  UseInfiniteQueryResult,
  keepPreviousData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { AnsiUp } from 'ansi_up';
import { addMilliseconds, sub } from 'date-fns';
import { useEffect, useLayoutEffect, useMemo, useReducer } from 'react';

import { API, getApiQueryKey, isApiQueryKey, useApi, useOrganizationQuotas } from 'src/api';
import { apiStream } from 'src/api/api';
import { getConfig } from 'src/application/config';
import { LogLine } from 'src/model';
import { last } from 'src/utils/arrays';
import { stripAnsi } from 'src/utils/strings';

export type LogStreamStatus = 'connecting' | 'connected' | 'disconnected';
export type LogType = 'build' | 'runtime';
export type LogStream = 'stdout' | 'stderr' | 'koyeb';
export type LogsPeriod = 'live' | '1h' | '6h' | '24h' | '7d' | '30d';
export type LogsAnsiMode = 'interpret' | 'strip';

type UseLogsParams = {
  deploymentId?: string;
  instanceId?: string;
  type: LogType;
  regions?: string[];
  streams?: LogStream[];
  search?: string;
  tail: boolean;
  ansiMode: LogsAnsiMode;
};

export type LogsApi = {
  stream: LogStreamStatus;
  error: Error | null;
  lines: LogLine[];
  loading: boolean;
  fetching: boolean;
  hasPrevious: boolean;
  loadPrevious: () => Promise<unknown>;
};

export function useLogs({ tail, ansiMode, ...params }: UseLogsParams): LogsApi {
  const history = useLogsHistory(params);
  const stream = useLogsStream(params, useStreamStart(tail, history));

  const lines = useMemo(() => {
    const ansi = new AnsiUp();

    return [...(history.data ?? []), ...stream.lines].map((line) => ({
      ...line,
      html: ansiMode === 'interpret' ? ansi.ansi_to_html(line.text) : stripAnsi(line.text),
    }));
  }, [history.data, stream.lines, ansiMode]);

  useClearHistoryCache(params, stream.status === 'connected');

  return {
    stream: stream.status,
    error: stream.error ?? history.error,
    lines,
    loading: history.isLoading,
    fetching: history.isFetching,
    hasPrevious: history.hasPreviousPage,
    loadPrevious: history.fetchPreviousPage,
  };
}

function transformApiLogLine(entry: API.LogEntry): LogLine {
  return {
    id: [entry.created_at, entry.labels?.instance_id].filter(Boolean).join('-'),
    date: entry.created_at!,
    text: entry.msg!,
    html: '',
    stream: entry.labels!.stream! as LogStream,
    instanceId: entry.labels?.instance_id,
  };
}

function getInitialPageParam(logsRetention: number) {
  const now = new Date().toISOString();

  return {
    end: now,
    start: sub(now, { days: logsRetention }).toISOString(),
  };
}

function useLogsHistory(params: Omit<UseLogsParams, 'tail' | 'ansiMode'>) {
  const { deploymentId, instanceId, type, regions, streams, search } = params;

  const api = useApi();
  const { logsRetention } = useOrganizationQuotas();

  return useInfiniteQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,

    placeholderData: keepPreviousData,

    queryKey: getApiQueryKey('get /v1/streams/logs/query', {
      query: {
        deployment_id: deploymentId,
        instance_id: instanceId,
        type,
        regions: regions?.length === 0 ? ['none'] : regions,
        streams: streams?.length === 0 ? [''] : streams,
        text: search || undefined,
        limit: '100',
        order: 'desc',
      },
    }),

    queryFn: async ({ queryKey: [endpoint, { query }], pageParam }) => {
      return api(endpoint, {
        query: {
          ...query,
          start: pageParam.start,
          end: pageParam.end,
        },
      });
    },

    initialPageParam: getInitialPageParam(logsRetention),

    getNextPageParam: () => null,
    getPreviousPageParam: ({ pagination }) => {
      if (!pagination?.has_more) {
        return null;
      }

      return {
        start: pagination.next_start!,
        end: pagination.next_end!,
      };
    },

    select: ({ pages }) => {
      return pages.flatMap((page): LogLine[] => page.data!.map(transformApiLogLine).reverse());
    },
  });
}

// this is needed to refetch the history to the current date
function useClearHistoryCache({ deploymentId }: Omit<UseLogsParams, 'tail' | 'ansiMode'>, clear: boolean) {
  const queryClient = useQueryClient();

  useLayoutEffect(() => {
    const predicate = ({ queryKey }: { queryKey: QueryKey }) => {
      return (
        isApiQueryKey(queryKey, 'get /v1/streams/logs/query') &&
        queryKey[1].query?.deployment_id === deploymentId &&
        queryKey[1].query?.type === 'build'
      );
    };

    return () => {
      if (clear) {
        queryClient.removeQueries({ predicate });
      }
    };
  }, [queryClient, deploymentId, clear]);
}

function useStreamStart(tail: boolean, history: UseInfiniteQueryResult<LogLine[]>) {
  const { isPending, data } = history;

  return useMemo(() => {
    if (!tail || isPending) {
      return null;
    }

    const lastLine = last(data ?? []);

    if (lastLine !== undefined) {
      return addMilliseconds(lastLine.date, 1).toISOString();
    }

    return new Date().toISOString();
  }, [tail, isPending, data]);
}

function useLogsStream(params: Omit<UseLogsParams, 'tail' | 'ansiMode'>, start: string | null) {
  const { deploymentId, instanceId, type, regions, streams, search } = params;

  const { getAccessToken } = useAuth();

  const [stream, dispatch] = useReducer(reducer, {
    status: 'disconnected',
    error: null,
    lines: [],
  });

  useEffect(() => {
    dispatch({ type: 'reset' });

    if (!start) {
      return;
    }

    let ws: WebSocket | null = null;

    const onOpen = () => dispatch({ type: 'open' });
    const onClose = () => dispatch({ type: 'close' });

    const onError = () => {
      dispatch({ type: 'error', error: new Error('WebSocket error') });
    };

    const onMessage = ({ data }: { data: string }) => {
      dispatch({ type: 'message', data: JSON.parse(data) as ApiLogData });
    };

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const timeout = window.setTimeout(async () => {
      dispatch({ type: 'connecting' });

      ws = apiStream(
        'get /v1/streams/logs/tail',
        {
          query: {
            deployment_id: deploymentId,
            instance_id: instanceId,
            type,
            regions: regions?.length === 0 ? ['none'] : regions,
            streams: streams?.length === 0 ? [''] : streams,
            text: search || undefined,
            start,
          },
        },
        {
          baseUrl: getConfig('apiBaseUrl'),
          token: await getAccessToken(),
        },
      );

      ws.addEventListener('open', onOpen);
      ws.addEventListener('close', onClose);
      ws.addEventListener('error', onError);
      ws.addEventListener('message', onMessage);
    }, 0);

    return () => {
      window.clearTimeout(timeout);

      if (ws !== null) {
        ws.close();

        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('close', onClose);
        ws.removeEventListener('error', onError);
        ws.removeEventListener('message', onMessage);

        dispatch({ type: 'close' });
      }
    };
  }, [getAccessToken, deploymentId, instanceId, type, regions, streams, search, start]);

  return stream;
}

type ApiLogData = { result: API.LogEntry } | { error: { message: string } };

type StreamState = {
  status: LogStreamStatus;
  error: Error | null;
  lines: LogLine[];
};

type StreamAction =
  | {
      type: 'reset';
    }
  | {
      type: 'connecting';
    }
  | {
      type: 'open';
    }
  | {
      type: 'close';
    }
  | {
      type: 'error';
      error: Error;
    }
  | {
      type: 'message';
      data: ApiLogData;
    };

function reducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'reset') {
    return { status: 'disconnected', error: null, lines: [] };
  }

  if (action.type === 'connecting') {
    return { ...state, status: 'connecting' };
  }

  if (action.type === 'open') {
    return { ...state, status: 'connected' };
  }

  if (action.type === 'close') {
    return { ...state, status: 'disconnected' };
  }

  if (action.type === 'error') {
    return { ...state, error: action.error };
  }

  if ('error' in action.data) {
    return { ...state, error: new Error(action.data.error.message) };
  } else {
    return { ...state, lines: [...state.lines, transformApiLogLine(action.data.result)] };
  }
}
