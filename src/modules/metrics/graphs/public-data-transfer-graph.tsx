import { formatBytes } from 'src/application/memory';
import { createTranslate } from 'src/intl/translate';
import { entries } from 'src/utils/object';

import { LineGraph } from '../components/line-graph';
import { toGraph } from '../metrics-helpers';
import { Metric } from '../metrics-types';

const T = createTranslate('pages.service.metrics.publicDataTransfer');

type Data = Record<'in' | 'out', Array<Metric> | undefined>;

type PublicDataTransferGraphProps = {
  loading: boolean;
  error?: unknown;
  data: Data;
};

export function PublicDataTransferGraph({ loading, error, data }: PublicDataTransferGraphProps) {
  const graphData = data ? getGraphData(data) : [];

  return (
    <LineGraph
      loading={loading}
      error={error}
      noData={graphData.length === 0}
      data={graphData}
      colors={['#d8b4fe', '#818cf8']}
      yFormat={(value) => formatBytes(value as number, { decimal: true, round: true })}
      axisLeft={{
        format: (value: number) => formatBytes(value, { decimal: true, round: true }),
      }}
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
