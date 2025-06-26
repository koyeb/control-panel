import { action } from 'storybook/actions';
import { Meta } from '@storybook/react-vite';
import { useRef } from 'react';

import Terminal, { TerminalRef } from './terminal';

export default {
  title: 'Components/Terminal',
} satisfies Meta;

export const terminal = () => {
  const shell = useRef(new Shell());
  const terminal = useRef<TerminalRef | null>(null);

  return (
    <Terminal
      ref={(term) => {
        terminal.current?.clear();

        if (term !== null) {
          terminal.current = term;
          shell.current.setTerminal(term);
        }
      }}
      onData={(data) => shell.current.onData(data)}
      onSizeChange={action('onSizeChange')}
    />
  );
};

class Shell {
  private terminal?: React.ComponentRef<typeof Terminal>;
  private input = '';

  setTerminal(terminal: TerminalRef) {
    this.terminal = terminal;
    this.prompt();
  }

  onData(data: string) {
    if (data === '\r') {
      const [command, ...args] = this.input.split(' ') as [string, ...string[]];

      this.terminal?.write('\r\n');

      if (command !== '') {
        this.terminal?.write(this.handleCommand(command, args));
      }

      this.prompt();

      this.input = '';
    } else if (data === '\x7F') {
      if (this.input.length === 0) {
        return;
      }

      this.terminal?.write('\b \b');
      this.input = this.input.slice(0, this.input.length - 1);
    } else {
      this.terminal?.write(data);
      this.input += data;
    }
  }

  private prompt() {
    this.terminal?.write('/bin/app$ ');
  }

  private handleCommand(command: string, args: string[]) {
    const blue = (str: string) => `\x1b[34m${str}\x1b[0m`;

    switch (command) {
      case 'echo':
        return `${args.join(' ')}\r\n`;

      case 'ls':
        return `${blue('node_modules')}  package.json  tsconfig.json  ${blue('public')}  ${blue('src')}  vite.config.ts\r\n`;

      case 'cat':
        return 'Miaow\r\n';

      default:
        return `${command}: command not found\r\n`;
    }
  }
}
