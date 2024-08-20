import { Translate } from 'src/intl/translate';

import { BarGraph } from '../components/bar-graph';
import { Metric } from '../metrics-types';

const T = Translate.prefix('pages.service.metrics.httpThroughput');

type Data = Array<Metric>;
type StatusCodeClass = '1xx' | '2xx' | '3xx' | '4xx' | '5xx';

type HttpThroughputGraphProps = {
  loading: boolean;
  error?: unknown;
  data?: Data;
};

export function HttpThroughputGraph({ loading, error, data }: HttpThroughputGraphProps) {
  const graphData = data ? getGraphData(data) : [];

  const labels = {
    '1xx': <T id="1xxLabel" />,
    '2xx': <T id="2xxLabel" />,
    '3xx': <T id="3xxLabel" />,
    '4xx': <T id="4xxLabel" />,
    '5xx': <T id="5xxLabel" />,
  };

  return (
    <BarGraph
      loading={loading}
      error={error}
      noData={graphData.length === 0}
      data={graphData}
      indexBy="date"
      keys={['1xx', '2xx', '3xx', '4xx', '5xx']}
      colors={['#d6d3d1', '#6ee7b7', '#93c5fd', '#fcd34d', '#fca5a5']}
      labels={labels}
      enableGridX={true}
      enableLabel={graphData.length <= 40}
      valueFormat={(value) => (value === 0 ? '' : String(value))}
    />
  );
}

function getGraphData(data: Data) {
  const result = new Map<string, Partial<Record<StatusCodeClass, number>>>();
  let hasData = false;

  for (const { samples, labels } of data) {
    for (const { date, value } of samples) {
      if (!result.has(date)) {
        result.set(date, {});
      }

      result.get(date)![labels?.code as StatusCodeClass] = value ?? 0;

      if (value !== undefined && value !== 0) {
        hasData = true;
      }
    }
  }

  if (!hasData) {
    return [];
  }

  return Array.from(result.entries()).map(([date, points]) => ({
    date,
    ...points,
  }));
}
