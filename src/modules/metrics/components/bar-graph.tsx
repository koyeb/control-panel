import { ResponsiveBar } from '@nivo/bar';
import { useState } from 'react';
import { useIntl } from 'react-intl';

import { useElementSize } from '@koyeb/design-system';
import { createTranslate } from 'src/intl/translate';

import { dateTickValues } from '../metrics-helpers';

import { GraphTooltip } from './graph-tooltip';
import { nivoTheme } from './nivo-theme';
import { NoMetrics } from './no-metrics';

const T = createTranslate('pages.service.metrics');

type BarGraphProps = React.ComponentProps<typeof NoMetrics> &
  React.ComponentProps<typeof ResponsiveBar> & {
    labels: Record<string, React.ReactNode>;
  };

export function BarGraph({ loading, error, noData, labels, ...props }: BarGraphProps) {
  const intl = useIntl();

  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const { width } = useElementSize(ref);

  if (loading || error || noData) {
    return <NoMetrics loading={loading} error={error} noData={noData} />;
  }

  const tickValuesX = dateTickValues(
    props.data.map((data) => data.date as string),
    width,
  );

  return (
    <div ref={setRef} className="h-64">
      <ResponsiveBar
        theme={nivoTheme}
        margin={{ top: 10, right: 10, bottom: 50, left: 50 }}
        gridXValues={tickValuesX}
        axisBottom={{
          format: (date: string) => intl.formatDate(date, { timeStyle: 'short' }),
          tickValues: tickValuesX,
        }}
        animate={false}
        tooltip={({ data }) => (
          <GraphTooltip
            data={props.keys!.map((key, index) => ({
              id: key,
              date: data.date as string,
              label: labels[key],
              color: (props.colors as string[])[index]!,
              value: data[key] ?? (
                <span className="font-normal text-inverted/60">
                  <T id="noValue" />
                </span>
              ),
            }))}
          />
        )}
        {...props}
      />
    </div>
  );
}
