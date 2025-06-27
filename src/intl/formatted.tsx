import { Tooltip } from '@koyeb/design-system';
import { useMemo } from 'react';
import { FormattedDate, FormattedNumber, FormattedRelativeTime } from 'react-intl';

import { identity } from 'src/utils/generic';

type FormattedPriceProps = {
  /** value in cents */
  value: number;
  digits?: number;
};

export function FormattedPrice({ value, digits }: FormattedPriceProps) {
  return (
    <FormattedNumber style="currency" currency="USD" maximumFractionDigits={digits} value={value / 100} />
  );
}

type RelativeTimeFormatSingularUnit = React.ComponentProps<typeof FormattedRelativeTime>['unit'];

type FormattedDistanceToNowTimeOwnProps = {
  value: Date | string;
  style?: Intl.RelativeTimeFormatStyle;
  children?: (formatted: React.ReactNode) => React.ReactNode;
};

type FormattedDistanceToNowTimeProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'style' | 'children'> &
  FormattedDistanceToNowTimeOwnProps;

export function FormattedDistanceToNow({
  value: valueProp,
  style,
  children = identity,
  ...props
}: FormattedDistanceToNowTimeProps) {
  const [value, unit] = useMemo(() => {
    return getDistanceToNow(new Date(valueProp));
  }, [valueProp]);

  return (
    <Tooltip content={<FormattedDate value={valueProp} dateStyle="medium" timeStyle="medium" />}>
      {(tooltipProps) => (
        <span {...tooltipProps} {...props}>
          {children(
            <FormattedRelativeTime
              value={value}
              unit={unit}
              style={style}
              updateIntervalInSeconds={['second', 'minute', 'hour'].includes(unit as string) ? 1 : undefined}
            />,
          )}
        </span>
      )}
    </Tooltip>
  );
}

function getDistanceToNow(date: Date): [number, RelativeTimeFormatSingularUnit] {
  let value = (date.getTime() - Date.now()) / 1000;

  if (Math.abs(value) < 60) {
    return [Math.round(value), 'second'];
  }

  value /= 60;

  if (Math.abs(value) < 60) {
    return [Math.round(value), 'minute'];
  }

  value /= 60;

  if (Math.abs(value) < 24) {
    return [Math.round(value), 'hour'];
  }

  value /= 24;

  if (Math.abs(value) < 31) {
    return [Math.round(value), 'day'];
  }

  value /= 31;

  if (Math.abs(value) < 12) {
    return [Math.round(value), 'month'];
  }

  value /= 12;

  return [Math.round(value), 'year'];
}
