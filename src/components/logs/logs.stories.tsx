import { Meta, StoryFn } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { action } from 'storybook/actions';

import { LogLine as LogLineType } from 'src/model';
import { create } from 'src/utils/factories';

import { LogLine, LogsLines } from './log-lines';
import { LogStream } from './use-logs';

type Args = {
  showDate: boolean;
  showStream: boolean;
  showInstanceId: boolean;
  wordWrap: boolean;
  tail: boolean;
  hasPrevious: boolean;
};

export default {
  title: 'Components/Logs',
  parameters: {
    className: 'max-w-4xl',
  },
  args: {
    showDate: true,
    showStream: true,
    showInstanceId: true,
    wordWrap: false,
    tail: true,
    hasPrevious: false,
  },
} satisfies Meta<Args>;

function createLogLine(stream: LogStream, text: string) {
  return create.logLine({ stream, instanceId: '123caffe', text, html: text });
}

const data = [
  createLogLine('koyeb', 'Instance created. Preparing to start...'),
  createLogLine('koyeb', 'Instance is starting... Waiting for health checks to pass.'),
  createLogLine('stderr', ''),
  createLogLine('stderr', '> example-expressjs@1.0.0 start'),
  createLogLine('stderr', '> node app.js'),
  createLogLine('stderr', ''),
  createLogLine('stdout', 'Starting server...'),
  createLogLine('stdout', 'Server listening on port 8000'),
  createLogLine('koyeb', 'Instance is healthy. All health checks are passing.'),
  createLogLine('stdout', 'GET / 200 42ms'),
  createLogLine('stdout', 'GET /v1/account/profile 200 69ms'),
  createLogLine('stdout', 'GET /v1/account/organization 200 6ms'),
];

export const logs: StoryFn<Args> = (args) => {
  const [lines, setLines] = useState<LogLineType[]>(data);

  useEffect(() => {
    let timeout: number;

    timeout = window.setTimeout(function addLogLine() {
      setLines((lines) => {
        if (lines.length < data.length) {
          return data.slice(0, lines.length + 1);
        } else {
          return [...lines, createLogLine('stdout', 'GET / 200 123ms')];
        }
      });

      timeout = window.setTimeout(addLogLine, 1_000);
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <LogsLines
      lines={lines}
      renderLine={(line) => <LogLine line={line} {...args} />}
      onScrollToTop={action('onScrollToTop')}
      onScrollToBottom={action('onScrollToBottom')}
      className="h-64"
      {...args}
    />
  );
};
