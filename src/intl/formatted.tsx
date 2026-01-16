import { Badge, TooltipTitle } from '@koyeb/design-system';
import { useMemo } from 'react';
import { FormattedNumber, FormattedRelativeTime } from 'react-intl';

import { Tooltip } from 'src/components/tooltip';
import { useNow } from 'src/hooks/timers';
import { formatDateInTimeZones } from 'src/utils/date';
import { identity } from 'src/utils/generic';

import { Translate } from './translate';

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
  const formatted = formatDateInTimeZones(new Date(valueProp));
  const now = useNow();

  const [value, unit] = useMemo(() => {
    return getDistanceToNow(new Date(valueProp), now);
  }, [valueProp, now]);

  return (
    <Tooltip
      arrow
      placement="top"
      trigger={(triggerProps) => (
        <span {...triggerProps} {...props}>
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
      className="col min-w-60 gap-3 text-xs"
      content={
        <>
          <TooltipTitle
            title={
              <FormattedRelativeTime
                value={value}
                unit={unit}
                updateIntervalInSeconds={
                  ['second', 'minute', 'hour'].includes(unit as string) ? 1 : undefined
                }
              />
            }
          />

          <div className="row items-center gap-1">
            <Badge size={1}>
              <Translate id="common.utc" />
            </Badge>
            <div>{formatted.utc({ dateStyle: 'medium' })}</div>
            <div className="ml-auto text-dim">{formatted.utc({ timeStyle: 'medium' })}</div>
          </div>

          <div className="row items-center gap-1">
            <Badge size={1}>
              <Translate id="common.utc" />
              {formatted.utcOffset}
            </Badge>
            <div>{formatted.local({ dateStyle: 'medium' })}</div>
            <div className="ml-auto text-dim">{formatted.local({ timeStyle: 'medium' })}</div>
          </div>
        </>
      }
    />
  );
}

function getDistanceToNow(date: Date, now: Date): [number, RelativeTimeFormatSingularUnit] {
  let value = (date.getTime() - now.getTime()) / 1000;

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
