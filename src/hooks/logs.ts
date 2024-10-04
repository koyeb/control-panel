import { AnsiUp } from 'ansi_up';
import { useEffect, useState } from 'react';
import { z } from 'zod';

import { ApiStream, apiStreams } from 'src/api/api';
import { LogLine } from 'src/api/model';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { useToken } from 'src/application/token';
import { assert } from 'src/utils/assert';

const connectTimeout = 5 * 1000;
const reconnectTimeouts = [1_000, 2_000, 5_000, 60_000];

export function useLogs(deploymentId: string, type: 'build' | 'runtime', connect = true) {
  const { token } = useToken();

  const [reconnection, setReconnection] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<unknown>();

  const [lines, setLines] = useState<LogLine[]>([]);

  useEffect(() => {
    if (!connect) {
      return;
    }

    function onOpen() {
      setConnected(true);
      setError(undefined);
    }

    function onClose() {
      setConnected(false);

      const timeout = reconnectTimeouts[reconnection];

      if (timeout !== undefined) {
        setTimeout(() => setReconnection(reconnection + 1), timeout);
      }
    }

    function onError(event: Event) {
      setError(event);
    }

    const ansi = new AnsiUp();

    function onMessage(event: MessageEvent) {
      assert(typeof event.data === 'string');

      const line = parseLogLine(JSON.parse(event.data));

      if ('error' in line) {
        setError(line.error);
      } else {
        setLines((lines) => [...lines, { ...line, html: ansi.ansi_to_html(line.text) }]);
      }
    }

    setLines([]);

    let socket: ApiStream | undefined = undefined;

    const timeout = setTimeout(() => {
      socket = apiStreams.logs({ token, query: { type, deployment_id: deploymentId } });

      socket.addEventListener('open', onOpen);
      socket.addEventListener('close', onClose);
      socket.addEventListener('error', onError);
      socket.addEventListener('message', onMessage);
    }, connectTimeout);

    return () => {
      clearTimeout(timeout);

      if (socket === undefined) {
        return;
      }

      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }

      socket?.removeEventListener('open', onOpen);
      socket?.removeEventListener('close', onClose);
      socket?.removeEventListener('error', onError);
      socket?.removeEventListener('message', onMessage);
    };
  }, [token, type, deploymentId, reconnection, connect]);

  return {
    connected,
    error,
    lines,
  };
}

const logLineSchema = z.object({
  result: z.object({
    created_at: z.string(),
    labels: z.object({
      stream: z.union([z.literal('stdout'), z.literal('stderr'), z.literal('koyeb')]),
      instance_id: z.string().optional(),
    }),
    msg: z.string(),
  }),
});

const isLogLine = createValidationGuard(logLineSchema);

const errorLogLineSchema = z.object({
  error: z
    .object({
      details: z.array(z.object({ message: z.string() })).optional(),
      message: z.string().optional(),
    })
    .optional(),
  message: z.string().optional(),
});

const isErrorLogLine = createValidationGuard(errorLogLineSchema);

function parseLogLine(data: unknown): Omit<LogLine, 'html'> | { error: string } {
  if (isLogLine(data)) {
    const { created_at, labels, msg } = data.result;

    return {
      date: created_at,
      stream: labels.stream,
      instanceId: labels.instance_id,
      text: msg,
    };
  }

  if (isErrorLogLine(data)) {
    const { error, message } = data;

    return {
      error: error?.details?.[0]?.message ?? error?.message ?? message ?? JSON.stringify(data),
    };
  }

  throw new Error('Cannot parse log line');
}
