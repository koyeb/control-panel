export function round(value: number, precision = 0) {
  const factor = Math.pow(10, precision);

  return Math.round(value * factor) / factor;
}

export function clamp(value: number, { min, max }: { min: number; max: number }) {
  return Math.max(min, Math.min(max, value));
}
