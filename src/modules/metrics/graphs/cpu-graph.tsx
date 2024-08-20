import { Serie } from '@nivo/line';
import { useIntl } from 'react-intl';

import { shortId } from 'src/utils/strings';

import { LineGraph } from '../components/line-graph';
import { toGraph } from '../metrics-helpers';
import { Metric } from '../metrics-types';

type CpuGraphProps = {
  loading: boolean;
  error?: unknown;
  data?: Array<Metric>;
};

export function CpuGraph({ loading, data, error }: CpuGraphProps) {
  const intl = useIntl();

  const tickValuesY = cpuTickValues();
  const series = getSeries(data);

  return (
    <LineGraph
      loading={loading}
      error={error}
      noData={series.length === 0}
      data={series}
      colors={{ scheme: 'set2' }}
      gridYValues={tickValuesY}
      yScale={{ min: 0, max: 100, type: 'linear' }}
      yFormat={(value) => intl.formatNumber((value as number) / 100, { style: 'percent' })}
      axisLeft={{
        format: (value: number) => intl.formatNumber(value / 100, { style: 'percent' }),
        tickValues: tickValuesY,
      }}
    />
  );
}

function cpuTickValues() {
  return [0, 25, 50, 75, 100];
}

function getSeries(data?: Array<Metric>): Serie[] {
  if (data === undefined) {
    return [];
  }

  const series = data.map((data) => ({
    id: data.labels!.instance_id!,
    label: shortId(data.labels!.instance_id),
    data: data.samples.map(toGraph),
  }));

  if (series.every((serie) => serie.data.every((data) => data.y === undefined))) {
    return [];
  }

  return series;
}
