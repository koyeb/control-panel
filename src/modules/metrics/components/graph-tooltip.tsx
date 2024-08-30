import { Fragment } from 'react';
import { FormattedDate } from 'react-intl';

type GraphTooltipProps = {
  data: Array<{
    id: string;
    date: string;
    label: React.ReactNode;
    color: string;
    value: React.ReactNode;
  }>;
};

export function GraphTooltip({ data }: GraphTooltipProps) {
  return (
    <div className="z-30 max-w-80 rounded-lg bg-inverted p-2 text-inverted shadow-lg">
      <div className="mb-4 text-xs font-medium text-inverted/80">
        <FormattedDate
          value={data[0]?.date}
          year="numeric"
          month="long"
          day="2-digit"
          hour="2-digit"
          minute="2-digit"
          second="2-digit"
        />
      </div>

      {/* eslint-disable-next-line tailwindcss/no-arbitrary-value */}
      <div className="inline-grid grid-cols-[repeat(3,min-content)] gap-x-3 gap-y-1 whitespace-nowrap">
        {data.map(({ id, label, color, value }) => (
          <Fragment key={id}>
            <div className="size-4 rounded" style={{ backgroundColor: color }} />
            <div>{label}</div>
            <div className="font-semibold">{value}</div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
