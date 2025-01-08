import { Serie } from '@nivo/line';

import { formatBytes, parseBytes } from 'src/application/memory';
import { createTranslate } from 'src/intl/translate';
import { unique } from 'src/utils/arrays';
import { isDefined } from 'src/utils/generic';
import { shortId } from 'src/utils/strings';

import { LineGraph } from '../components/line-graph';
import { toGraph } from '../metrics-helpers';
import { Metric } from '../metrics-types';

const T = createTranslate('modules.metrics.memory');

type MemoryGraphProps = {
  loading: boolean;
  error?: unknown;
  data?: Array<Metric>;
  max: number | null;
};

export function MemoryGraph({ loading, error, data, max }: MemoryGraphProps) {
  const tickValuesY = memoryTickValues(max);
  const series = getSeries(data);
  const dates = unique(series.flatMap(({ data }) => data.map((sample) => sample.x)).filter(isDefined));

  return (
    <LineGraph
      loading={loading}
      error={error}
      noData={series.length === 0}
      data={[
        {
          id: 'max',
          label: <T id="maxLabel" />,
          data: dates.map((date) => ({ id: 'max', label: <T id="maxLabel" />, x: date, y: max })),
        },
        ...series,
      ]}
      colors={{ scheme: 'set2' }}
      gridYValues={tickValuesY}
      yScale={{ min: 0, max: tickValuesY?.[tickValuesY?.length - 1] ?? 'auto', type: 'linear' }}
      yFormat={(value) => formatBytes(value as number, { decimal: true, round: true })}
      axisLeft={{
        format: (value: number) => formatBytes(value, { decimal: true }),
        tickValues: tickValuesY,
      }}
    />
  );
}

function memoryTickValues(max: number | null) {
  if (max === null) {
    return undefined;
  }

  if (max <= parseBytes('256MB')) {
    return ['0B', '50MB', '100MB', '150MB', '200MB', '250MB', '300MB'].map(parseBytes);
  }

  if (max <= parseBytes('512MB')) {
    return ['0B', '100MB', '200MB', '300MB', '400MB', '500MB', '600MB'].map(parseBytes);
  }

  if (max <= parseBytes('1GB')) {
    return ['0B', '200MB', '400MB', '600MB', '800MB', '1GB', '1.2GB'].map(parseBytes);
  }

  if (max <= parseBytes('2GB')) {
    return ['0B', '500MB', '1GB', '1.5GB', '2GB'].map(parseBytes);
  }

  if (max <= parseBytes('4GB')) {
    return ['0B', '1GB', '2GB', '3GB', '4GB', '5GB'].map(parseBytes);
  }

  if (max <= parseBytes('8GB')) {
    return ['0B', '2GB', '4GB', '6GB', '8GB', '10GB'].map(parseBytes);
  }

  if (max <= parseBytes('16GB')) {
    return ['0B', '4GB', '8GB', '12GB', '16GB', '20GB'].map(parseBytes);
  }

  if (max <= parseBytes('32GB')) {
    return ['0B', '8GB', '16GB', '24GB', '32GB', '40GB'].map(parseBytes);
  }

  if (max <= parseBytes('44GB')) {
    return ['0B', '8GB', '16GB', '24GB', '32GB', '40GB', '48GB'].map(parseBytes);
  }

  if (max <= parseBytes('64GB')) {
    return ['0B', '16GB', '32GB', '48GB', '64GB', '80GB'].map(parseBytes);
  }

  if (max <= parseBytes('128GB')) {
    return ['0B', '32GB', '64GB', '96GB', '128GB', '160GB'].map(parseBytes);
  }
}

function getSeries(data?: Array<Metric>): Serie[] {
  if (data === undefined) {
    return [];
  }

  const series = [
    ...data.map((data) => ({
      id: data.labels!.instance_id!,
      label: shortId(data.labels!.instance_id),
      data: data.samples.map(toGraph),
    })),
  ];

  if (series.every((serie) => serie.data.every((data) => data.y === undefined))) {
    return [];
  }

  return series;
}
