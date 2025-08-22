import { useIntl } from 'react-intl';

import { isDefined } from 'src/utils/generic';
import { shortId } from 'src/utils/strings';

import { LineGraph } from '../components/line-graph';
import { LabelledLineSeries } from '../components/nivo';
import { toGraph } from '../metrics-helpers';
import { Metric } from '../metrics-types';

type CpuGraphProps = {
  loading: boolean;
  error?: unknown;
  data?: Array<Metric>;
};

export function CpuGraph({ loading, data, error }: CpuGraphProps) {
  const intl = useIntl();
  const series = getSeries(data);

  const values = data?.flatMap((data) => data.samples.map(({ value }) => value)).filter(isDefined);
  const max = Math.max(...(values ?? [0]));

  return (
    <LineGraph
      loading={loading}
      error={error}
      noData={series.length === 0}
      data={series}
      colors={{ scheme: 'set2' }}
      yScale={{ min: 0, max: Math.max(max, 100), type: 'linear' }}
      yFormat={(value) => intl.formatNumber((value as number) / 100, { style: 'percent' })}
      axisLeft={{
        format: (value: number) => intl.formatNumber(value / 100, { style: 'percent' }),
      }}
    />
  );
}

function getSeries(data?: Array<Metric>): LabelledLineSeries[] {
  if (data === undefined) {
    return [];
  }

  const series = data.map((data) => ({
    id: data.labels!.instance_id!,
    label: shortId(data.labels!.instance_id),
    data: data.samples.map(toGraph),
  }));

  if (series.every((serie) => serie.data.every((data) => data.y === null))) {
    return [];
  }

  return series;
}
