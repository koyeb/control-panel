import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@workos-inc/authkit-react';
import { AnsiUp } from 'ansi_up';
import { sub } from 'date-fns';
import { useEffect, useMemo, useReducer, useState } from 'react';

import { API, useApi, useOrganizationQuotas } from 'src/api';
import { apiStream } from 'src/api/api';
import { getConfig } from 'src/application/config';
import { LogLine } from 'src/model';
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
  loadPrevious: () => void;
};

export function useLogs({ tail, ansiMode, ...params }: UseLogsParams): LogsApi {
  const [end] = useState(new Date().toISOString());

  const history = useLogsHistory(end, params);
  const stream = useLogsStream(tail, end, params);

  const lines = useMemo(() => {
    const ansi = new AnsiUp();

    return [...(history.data ?? []), ...stream.lines].map((line) => ({
      ...line,
      html: ansiMode === 'interpret' ? ansi.ansi_to_html(line.text) : stripAnsi(line.text),
    }));
  }, [history.data, stream.lines, ansiMode]);

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

function useLogsHistory(
  end: string,
  { deploymentId, instanceId, type, regions, streams, search }: Omit<UseLogsParams, 'tail' | 'ansiMode'>,
) {
  const api = useApi();
  const { logsRetention } = useOrganizationQuotas();

  return useInfiniteQuery({
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,

    queryKey: [
      'logsHistory',
      {
        deploymentId,
        instanceId,
        type,
        regions,
        streams,
        search,
        logsRetention,
      },
    ],

    queryFn: async ({ pageParam }) => {
      return api('get /v1/streams/logs/query', {
        query: {
          deployment_id: deploymentId,
          instance_id: instanceId,
          type,
          regions: regions?.length === 0 ? ['none'] : regions,
          streams: streams?.length === 0 ? [''] : streams,
          text: search || undefined,
          start: pageParam.start,
          end: pageParam.end,
          limit: '100',
          order: 'desc',
        },
      });
    },

    initialPageParam: {
      end,
      start: sub(end, { days: logsRetention }).toISOString(),
    },

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
      return pages.flatMap((page): LogLine[] => page.data!.map(transformLogLine).reverse());
    },
  });
}

function useLogsStream(
  connect: boolean,
  start: string,
  { deploymentId, instanceId, type, regions, streams, search }: Omit<UseLogsParams, 'tail' | 'ansiMode'>,
) {
  const { getAccessToken } = useAuth();

  const [stream, dispatch] = useReducer(reducer, {
    status: 'disconnected',
    error: null,
    lines: [],
  });

  useEffect(() => {
    if (!connect) {
      return;
    }

    let ws: WebSocket | null = null;

    const onOpen = () => dispatch({ type: 'open' });
    const onClose = () => dispatch({ type: 'close' });
    const onError = () => dispatch({ type: 'error', error: new Error('Websocket error') });
    const onMessage = ({ data }: { data: string }) => dispatch({ type: 'message', data: JSON.parse(data) });

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
  }, [getAccessToken, connect, start, deploymentId, instanceId, type, regions, streams, search]);

  return stream;
}

function transformLogLine(entry: API.LogEntry): LogLine {
  return {
    id: entry.created_at!,
    date: entry.created_at!,
    text: entry.msg!,
    html: '',
    stream: entry.labels!.stream! as LogStream,
    instanceId: entry.labels?.instance_id,
  };
}

type StreamState = {
  status: LogStreamStatus;
  error: Error | null;
  lines: LogLine[];
};

type StreamAction =
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
      data: { result: API.LogEntry } | { error: { message: string } };
    };

function reducer(state: StreamState, action: StreamAction): StreamState {
  if (action.type === 'connecting') {
    return { ...state, status: 'connecting', lines: [] };
  }

  if (action.type === 'open') {
    return { ...state, status: 'connected', lines: [] };
  }

  if (action.type === 'close') {
    return { ...state, status: 'disconnected', lines: [] };
  }

  if (action.type === 'error') {
    return { ...state, error: action.error };
  }

  if (action.type === 'message') {
    if ('error' in action.data) {
      return { ...state, error: new Error(action.data.error.message) };
    } else {
      return { ...state, lines: [...state.lines, transformLogLine(action.data.result)] };
    }
  }

  return state;
}
