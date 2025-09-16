import { DataPoint, GraphDataPoint } from './metrics-types';

export const metricsTimeFrames = ['5m', '15m', '1h', '6h', '1d', '2d', '7d'] as const;
export type MetricsTimeFrame = (typeof metricsTimeFrames)[number];

export function toGraph({ date, value }: DataPoint): GraphDataPoint {
  const result: GraphDataPoint = { x: date, y: null };

  if (value !== undefined && Number.isFinite(value)) {
    result.y = value;
  }

  return result;
}

export function dateTickValues(data: string[], width?: number) {
  const points = data.length;
  const max = Math.floor(width ? width / 70 : 1);
  const modulo = Math.floor(points / max);

  if (modulo === 0) {
    return data;
  }

  return data.filter((_, index) => index % modulo === 0);
}
