export function round(value: number, precision = 0) {
  const factor = Math.pow(10, precision);

  return Math.round(value * factor) / factor;
}
