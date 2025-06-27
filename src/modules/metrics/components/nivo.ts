import { LineSeries } from '@nivo/line';

export type LabelledLineSeries = LineSeries & { label: React.ReactNode };

export const nivoTheme = {
  axis: {
    ticks: {
      text: {
        fill: 'var(--color-dim)',
      },
    },
  },
  grid: {
    line: {
      stroke: '#9993',
    },
  },
};
