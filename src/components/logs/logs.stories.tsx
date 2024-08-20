import { Meta } from '@storybook/react';
import { useEffect, useState } from 'react';

import { LogLine } from 'src/api/model';
import { ComponentPlaceholder } from 'src/storybook';
import { createArray } from 'src/utils/arrays';
import { createDate } from 'src/utils/date';

import { Logs } from './logs';

export default {
  title: 'Components/Logs',
  parameters: { className: 'max-w-main' },
} satisfies Meta;

export function logs() {
  const [lines, setLines] = useState<LogLine[]>([]);

  useEffect(() => {
    function addLine() {
      setLines((lines) => [...lines, generateLogLine()]);
      timeout = setTimeout(addLine, randInt(10, 1000));
    }

    let timeout = setTimeout(addLine, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Logs
      appName="my-app"
      serviceName="my-service"
      header={<ComponentPlaceholder />}
      lines={lines}
      renderLine={(line) => <div>{line.text}</div>}
    />
  );
}

function generateLogLine(): LogLine {
  return {
    date: createDate(),
    stream: 'stdout',
    text: generateSentence(),
    html: '',
  };
}

function generateSentence() {
  return createArray(randInt(1, 15), () => generateWord()).join(' ');
}

function generateWord() {
  return createArray(randInt(1, 15), () =>
    String.fromCharCode(randInt('a'.charCodeAt(0), 'z'.charCodeAt(0))),
  ).join('');
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}
