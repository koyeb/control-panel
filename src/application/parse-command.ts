export function parseCommand(value: string): string[] {
  const result: string[] = [];
  let buf = '';

  const flush = () => {
    result.push(buf);
    buf = '';
  };

  for (let i = 0; i < value.length; ++i) {
    const char = value[i];

    if (char === '"' || char === "'") {
      const nextQuoteIndex = value.indexOf(char, i + 1);

      if (nextQuoteIndex === -1) {
        buf += value.slice(i);
        flush();
        break;
      }

      buf += value.slice(i + 1, nextQuoteIndex);
      i = nextQuoteIndex;

      if (value[i + 1] === ' ' || value[i + 1] === undefined) {
        flush();
      }
    } else if (char === ' ') {
      if (buf !== '') {
        flush();
      }
    } else {
      buf += char;
    }
  }

  if (buf !== '') {
    flush();
  }

  return result;
}

export function formatCommand(command: string[]): string {
  let result = command[0] ?? '';

  command.slice(1).forEach((chunk) => {
    if (chunk === '') {
      result += " ''";
    } else if (chunk.includes(' ')) {
      if (chunk.includes('"')) {
        result += ` '${chunk}'`;
      } else {
        result += ` "${chunk}"`;
      }
    } else {
      result += ` ${chunk}`;
    }
  });

  return result;
}
