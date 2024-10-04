import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

import { ApiStream, apiStreams } from 'src/api/api';
import { createValidationGuard } from 'src/application/create-validation-guard';
import { UnexpectedError } from 'src/application/errors';
import { reportError } from 'src/application/report-error';
import { useToken } from 'src/application/token';
import { TerminalRef } from 'src/components/terminal/terminal';
import { useMount } from 'src/hooks/lifecycle';
import { Translate } from 'src/intl/translate';
import { assert } from 'src/utils/assert';

import { terminalColors } from './terminal-colors';
import { usePrompt } from './use-prompt';

const T = Translate.prefix('pages.service.console');

const { brightBlack, brightRed } = terminalColors;

export function useTerminal(instanceId: string) {
  const { token } = useToken();
  const t = T.useTranslate();

  const [terminal, setTerminal] = useState<TerminalRef | null>(null);
  const [stream, setStream] = useState<ApiStream | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();

  const { prompt, reset } = usePrompt(instanceId, stream, terminal);

  const connect = useCallback(
    (instanceId: string) => {
      setStream(apiStreams.exec({ token: token ?? undefined, query: { id: instanceId } }));
    },
    [token],
  );

  useMount(() => {
    connect(instanceId);
  });

  useEffect(() => {
    return () => stream?.close();
  }, [stream]);

  const onData = useCallback(
    (data: string) => {
      if (prompt !== undefined) {
        prompt(data);
      } else if (stream?.readyState === WebSocket.OPEN) {
        const message: ExecInputStdin = {
          body: {
            stdin: { data: btoa(data) },
          },
        };

        stream.send(JSON.stringify(message));
      } else if (terminal) {
        reset(terminal);
        connect(instanceId);
      }
    },
    [prompt, stream, terminal, reset, connect, instanceId],
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = getEventData(event);

      if (data === undefined) {
        reportError(new UnexpectedError('Cannot parse instance exec data', { data: event.data }));
        return;
      }

      if ('error' in data) {
        const error = data.error;
        let message = error.message;

        if (isFailedPreconditionError(error)) {
          message += `: ${error.details[0]?.message}`;
        } else {
          reportError(new UnexpectedError('Instance exec API error', error));
        }

        terminal?.write(brightRed(message) + '\r\n');
        terminal?.write(brightBlack(t('restart') + '\r\n'));

        stream?.close();
        return;
      }

      const { stdout, stderr, exited, exit_code: exitCode } = data.result;

      if (stdout !== null) {
        terminal?.write(atob(stdout.data));
      }

      if (stderr !== null) {
        terminal?.write(atob(stderr.data));
      }

      if (exited) {
        const f = exitCode === 0 ? brightBlack : brightRed;

        terminal?.write(f(t('commandExited') + exitCode + '\r\n'));
        terminal?.write(brightBlack(t('restart') + '\r\n'));

        stream?.close();
      }
    }

    function onError(event: Event) {
      reportError(new UnexpectedError('Instance exec stream error', { event }));

      terminal?.write(t('unexpectedError') + '\r\n');
      terminal?.write(brightBlack(t('restart') + '\r\n'));

      stream?.close();
    }

    stream?.addEventListener('message', onMessage);
    stream?.addEventListener('error', onError);

    return () => {
      stream?.removeEventListener('message', onMessage);
      stream?.removeEventListener('error', onError);
    };
  }, [t, terminal, stream]);

  const sendTtySize = useCallback(
    (size: ExecInputTtySize['body']['tty_size']) => {
      const message: ExecInputTtySize = {
        body: { tty_size: size },
      };

      if (stream?.readyState === WebSocket.OPEN) {
        stream.send(JSON.stringify(message));
      }
    },
    [stream],
  );

  useEffect(() => {
    if (prompt === undefined && size !== undefined) {
      sendTtySize(size);
    }
  }, [prompt, sendTtySize, size]);

  const onSizeChanged = useCallback((size: { cols: number; rows: number }) => {
    setSize({ width: size.cols, height: size.rows });
  }, []);

  return {
    setTerminal,
    onData,
    onSizeChanged,
  };
}

type ExecInputStdin = {
  body: {
    stdin: {
      data: string;
    };
  };
};

type ExecInputTtySize = {
  body: {
    tty_size: {
      width: number;
      height: number;
    };
  };
};

const execOutputSchema = z.union([
  z.object({
    result: z.object({
      stdout: z.object({ data: z.string() }).nullable(),
      stderr: z.object({ data: z.string() }).nullable(),
      exited: z.boolean(),
      exit_code: z.number(),
    }),
  }),
  z.object({
    error: z.object({
      message: z.string(),
      details: z.unknown(),
    }),
  }),
]);

const isExecOutput = createValidationGuard(execOutputSchema);

function getEventData(event: MessageEvent): z.infer<typeof execOutputSchema> | undefined {
  try {
    assert(typeof event.data === 'string');

    const data: unknown = JSON.parse(event.data);

    if (isExecOutput(data)) {
      return data;
    }
  } catch {
    return;
  }
}

const isFailedPreconditionError = createValidationGuard(
  z.object({
    message: z.literal('failed_precondition'),
    details: z.array(z.object({ message: z.string() })),
  }),
);
