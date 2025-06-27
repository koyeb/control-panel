import { useElementSize } from '@koyeb/design-system';
import { ResponsiveLine } from '@nivo/line';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { toObject } from 'src/utils/object';
import { Extend } from 'src/utils/types';

import { dateTickValues } from '../metrics-helpers';

import { GraphTooltip } from './graph-tooltip';
import { LabelledLineSeries, nivoTheme } from './nivo';
import { NoMetrics } from './no-metrics';

type LineGraphProps = React.ComponentProps<typeof NoMetrics> &
  Extend<React.ComponentProps<typeof ResponsiveLine>, { data: LabelledLineSeries[] }>;

export function LineGraph({ loading, error, noData, ...props }: LineGraphProps) {
  const intl = useIntl();

  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const { width } = useElementSize(ref);

  if (loading || error || noData) {
    return <NoMetrics loading={loading} error={error} noData={noData} />;
  }

  const tickValuesX = dateTickValues(props.data[0]?.data.map((data) => data.x as string) ?? [], width);

  const labels = toObject(
    props.data,
    (data) => data.id,
    (data) => data.label,
  );

  return (
    <div ref={setRef} className="h-64 w-full">
      <ResponsiveLine
        theme={nivoTheme}
        margin={{ top: 10, right: 20, bottom: 40, left: 60 }}
        gridXValues={tickValuesX}
        axisBottom={{
          format: (date: string) => intl.formatDate(date, { timeStyle: 'short' }),
          tickValues: tickValuesX,
        }}
        animate={false}
        enablePoints={false}
        useMesh={true}
        enableArea={true}
        areaOpacity={0.1}
        enableSlices="x"
        curve="monotoneX"
        sliceTooltip={(props) => (
          <GraphTooltip
            data={props.slice.points.map((point) => ({
              id: point.id,
              date: point.data.x as string,
              label: labels[point.seriesId],
              color: point.color,
              value: point.data.yFormatted,
            }))}
          />
        )}
        {...props}
      />
    </div>
  );
}
