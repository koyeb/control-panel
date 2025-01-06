import { createTranslate } from 'src/intl/translate';
import { entries } from 'src/utils/object';

import { LineGraph } from '../components/line-graph';
import { toGraph } from '../metrics-helpers';
import { Metric } from '../metrics-types';

const T = createTranslate('pages.service.metrics.responseTime');

type Data = Record<'50p' | '90p' | '99p' | 'max', Array<Metric> | undefined>;

type ResponseTimeGraphProps = {
  loading: boolean;
  error?: unknown;
  data: Data;
};

export function ResponseTimeGraph({ loading, error, data }: ResponseTimeGraphProps) {
  const graphData = data ? getGraphData(data) : [];

  return (
    <LineGraph
      loading={loading}
      error={error}
      noData={graphData.every((data) => data.data.length === 0)}
      data={graphData}
      colors={['#34d399', '#22d3ee', '#facc15', '#fb923c']}
      yFormat={(value) => `${Math.ceil(value as number)}ms`}
    />
  );
}

function getGraphData(data: Data) {
  const result = entries(data).map(([name, metrics]) => ({
    id: name,
    label: <T id={`${name}Label`} />,
    data: metrics?.[0]?.samples.map(toGraph) ?? [],
  }));

  if (result.every((points) => points.data.every((point) => point.y === null || point.y === 0))) {
    return [];
  }

  return result;
}
