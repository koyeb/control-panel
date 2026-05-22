import { DataPoint, GraphDataPoint } from './metrics-types';

export const metricsTimeFrames = ['5m', '15m', '1h', '6h', '1d', '2d', '7d'] as const;
export type MetricsTimeFrame = (typeof metricsTimeFrames)[number];

export const metricsSteps = ['1m', '5m', '15m', '30m', '1h', '2h', '3h', '6h', '12h'] as const;
export type MetricsStep = (typeof metricsSteps)[number];

export function getDefaultStep(timeFrame: MetricsTimeFrame): MetricsStep {
  const defaultSteps: Record<MetricsTimeFrame, MetricsStep> = {
    '5m': '1m',
    '15m': '1m',
    '1h': '1m',
    '6h': '5m',
    '1d': '30m',
    '2d': '1h',
    '7d': '3h',
  };

  return defaultSteps[timeFrame];
}

export function getValidStepsForTimeFrame(timeFrame: MetricsTimeFrame): MetricsStep[] {
  const validSteps: Record<MetricsTimeFrame, MetricsStep[]> = {
    '5m': ['1m'],
    '15m': ['1m', '5m'],
    '1h': ['1m', '5m'],
    '6h': ['1m', '5m', '15m', '30m'],
    '1d': ['5m', '15m', '30m', '1h'],
    '2d': ['15m', '30m', '1h', '2h'],
    '7d': ['30m', '1h', '2h', '3h', '6h', '12h'],
  };

  return validSteps[timeFrame];
}

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
