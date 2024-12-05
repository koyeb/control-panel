export function parseBytes(input: string | undefined) {
  const result = /^([0-9.]+) ?([KMGT]?i?B)$/.exec(input ?? '');

  if (!result) {
    return NaN;
  }

  const [, value, unit] = result;
  let factor = 1;

  if (unit === 'KB') {
    factor = Math.pow(10, 3);
  }

  if (unit === 'KiB') {
    factor = Math.pow(2, 10);
  }

  if (unit === 'MB') {
    factor = Math.pow(10, 6);
  }

  if (unit === 'MiB') {
    factor = Math.pow(2, 20);
  }

  if (unit === 'GB') {
    factor = Math.pow(10, 9);
  }

  if (unit === 'GiB') {
    factor = Math.pow(2, 30);
  }

  if (unit === 'TB') {
    factor = Math.pow(10, 12);
  }

  if (unit === 'TiB') {
    factor = Math.pow(2, 40);
  }

  return Number(value) * factor;
}

type FormatBytesOptions = {
  round?: boolean;
  decimal?: boolean;
};

function formatBytesToUnit(bytes: number, units: string[], factor: number, round = false) {
  let result = bytes;
  let unitIndex = 0;

  while (result >= factor && unitIndex < units.length - 1) {
    result /= factor;
    unitIndex++;
  }

  return [round ? Math.round(result) : result, units[unitIndex]] as const;
}

export function formatBytes(bytes: number, opts: FormatBytesOptions = {}) {
  return formatBytesToUnit(
    bytes,
    opts.decimal ? ['B', 'KB', 'MB', 'GB', 'TB'] : ['B', 'KiB', 'MiB', 'GiB', 'TiB'],
    opts.decimal ? 1000 : 1024,
    opts.round,
  ).join(' ');
}
