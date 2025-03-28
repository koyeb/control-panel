import { useCallback, useEffect, useState } from 'react';

import { ApiStream } from 'src/api/api';
import { TerminalRef } from 'src/components/terminal/terminal';
import { useSessionStorage } from 'src/hooks/storage';
import { createTranslate } from 'src/intl/translate';

import { terminalColors } from './terminal-colors';

const T = createTranslate('pages.service.console');

const { bold, rgb } = terminalColors;

const defaultInitialCommand = '/bin/sh';
const enter = '\x0D';
const backspace = '\x7F';

export function usePrompt(instanceId: string, stream: ApiStream | null, terminal: TerminalRef | null) {
  const t = T.useTranslate();

  const [initialized, setInitialized] = useState(false);
  const [command, setCommand] = useState<string | null>(null);
  const [initialCommand, setInitialCommand] = useSessionStorage('shellInitialCommand', {
    parse: String,
    stringify: String,
  });

  const reset = useCallback(
    (terminal: TerminalRef) => {
      terminal.write('\x1b[2K\r');
      terminal.clear();
      terminal.focus();

      const prompt = t('prompt');
      const command = initialCommand ?? defaultInitialCommand;

      setCommand(command);

      terminal.write(bold(rgb(127, 127, 127)(prompt)));
      terminal.write(command);
    },
    [t, initialCommand],
  );

  useEffect(() => {
    if (!initialized && terminal) {
      reset(terminal);
      setInitialized(true);
    }
  }, [initialized, terminal, reset]);

  const prompt = useCallback(
    (input: string) => {
      if (stream === null || terminal === null || command === null) {
        return;
      }

      if (input === enter && command !== '') {
        if (stream.readyState !== WebSocket.OPEN) {
          return;
        }

        stream.send(
          JSON.stringify({
            id: instanceId,
            id_type: 'INSTANCE_ID',
            body: { command: command.split(' ') },
          }),
        );

        terminal.write('\r\n');

        setInitialCommand(command);
        setCommand(null);
      } else if (input === backspace) {
        if (command === '') {
          return;
        }

        terminal.write('\b \b');
        setCommand(command?.slice(0, command.length - 1));
      } else if (input[0]! < '\x20') {
        // control character
      } else {
        // regular input
        terminal.write(input);
        setCommand(command + input);
      }
    },
    [terminal, instanceId, stream, command, setInitialCommand],
  );

  return {
    prompt: command !== null ? prompt : undefined,
    reset,
  };
}
