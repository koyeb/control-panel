export const terminalColors = {
  reset: color(0),
  bold: color(1),
  light: color(2),
  italic: color(3),
  underline: color(4),
  black: color(30),
  red: color(31),
  green: color(32),
  yellow: color(33),
  blue: color(34),
  magenta: color(35),
  cyan: color(36),
  white: color(37),
  brightBlack: color(90),
  brightRed: color(91),
  brightGreen: color(92),
  brightYellow: color(93),
  brightBlue: color(94),
  brightMagenta: color(95),
  brightCyan: color(96),
  brightWhite: color(97),
  rgb,
};

function color(code: number) {
  return (str: string) => `\x1b[${code}m${str}\x1b[0m`;
}

function rgb(r: number, g: number, b: number) {
  return (str: string) => `\x1b[38;2;${r};${g};${b}m${str}\x1b[0m`;
}
