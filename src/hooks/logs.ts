import { sub } from 'date-fns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { api, apiStreams } from 'src/api/api';
import { LogLine } from 'src/api/model';
import { useToken } from 'src/application/token';

export type LogStream = 'stdout' | 'stderr' | 'koyeb';
export type LogType = 'build' | 'runtime';

export interface LogsAdapter {
  query(filters: LogsQueryFilters): Promise<LogLine[]>;
  tail(filters: LogsTailFilters): LogStreamAdapter;
}

export interface LogStreamAdapter {
  close(): void;
  onLogLine(handler: (line: LogLine) => void): void;
}

export type LogsFilters = {
  type: LogType;
  appId?: string;
  serviceId?: string;
  deploymentId?: string;
  instanceId?: string;
};

export type LogsQueryFilters = LogsFilters & {
  start: Date;
  end?: Date;
  order?: 'asc' | 'desc';
  limit?: number;
};

export type LogsTailFilters = LogsFilters & {
  start?: Date;
};

export function useLogs(
  deploymentId: string,
  type: LogType,
  connect: boolean,
): { error?: Error; lines: LogLine[] } {
  const [lines, setLines] = useState<LogLine[]>([]);
  const adapter = useLogsAdapter();
  const stream = useRef<LogStreamAdapter>(null);

  const initialize = useCallback(async () => {
    const filters: LogsFilters = { type, deploymentId };
    const now = new Date();

    stream.current?.close();
    setLines([]);

    const lines = await adapter.query({
      ...filters,
      start: sub(now, { minutes: 15 }),
      end: now,
      order: 'desc',
      limit: 100,
    });

    setLines(lines.reverse());

    stream.current = adapter.tail({
      ...filters,
      start: now,
    });

    stream.current.onLogLine((line) => setLines((lines) => [...lines, line]));
  }, [adapter, type, deploymentId]);

  useEffect(() => {
    if (!connect) {
      return;
    }

    initialize().catch(console.error);
  }, [connect, initialize]);

  return {
    lines,
  };
}

function useLogsAdapter(): LogsAdapter {
  const { token } = useToken();

  return useMemo(
    () => ({
      query: (filters) => queryLogs(token, filters),
      tail: (filters) => tailLogs(token, filters),
    }),
    [token],
  );
}

async function queryLogs(token: string | undefined, filters: LogsQueryFilters) {
  const result = await api.logs({
    token,
    query: {
      type: filters.type,
      app_id: filters.appId,
      service_id: filters.serviceId,
      deployment_id: filters.deploymentId,
      instance_id: filters.instanceId,
      start: filters.start.toISOString(),
      end: filters.end?.toISOString(),
      order: filters.order,
      limit: filters.limit ? String(filters.limit) : undefined,
    },
  });

  return result.data!.map((data) => {
    return getLogLine(apiLogLineSchema.parse(data));
  });
}

function tailLogs(token: string | undefined, filters: LogsTailFilters) {
  const stream = apiStreams.logs({
    token,
    query: {
      type: filters.type,
      app_id: filters.appId,
      service_id: filters.serviceId,
      deployment_id: filters.deploymentId,
      instance_id: filters.instanceId,
      start: filters.start?.toISOString(),
    },
  });

  stream.addEventListener('error', console.error);

  return {
    close() {
      stream.close();
    },
    onLogLine(handler: (line: LogLine) => void) {
      stream.addEventListener('message', (message) => {
        const { success, data, error } = apiMessageSchema.safeParse(JSON.parse(message.data));

        if (!success) {
          throw error;
        }

        if ('error' in data) {
          throw new Error(data.error.message);
        }

        handler(getLogLine(data.result));
      });
    },
  };
}

function getLogLine(result: z.infer<typeof apiLogLineSchema>): LogLine {
  return {
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
