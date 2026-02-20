import { Badge, TooltipTitle } from '@koyeb/design-system';
import { useMemo } from 'react';
import { FormattedDate, FormattedNumber, FormattedRelativeTime } from 'react-intl';

import { Tooltip } from 'src/components/tooltip';
import { useNow } from 'src/hooks/timers';
import { inArray } from 'src/utils/arrays';
import { getUtcOffset } from 'src/utils/date';
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
  forceDesktop?: boolean;
  children?: (formatted: React.ReactNode) => React.ReactNode;
};

type FormattedDistanceToNowTimeProps = Omit<React.HTMLAttributes<HTMLSpanElement>, 'style' | 'children'> &
  FormattedDistanceToNowTimeOwnProps;

export function FormattedDistanceToNow({
  value,
  style,
  forceDesktop,
  children = identity,
  ...props
}: FormattedDistanceToNowTimeProps) {
  const now = useNow();

  const [relativeTime, unit] = useMemo(() => {
    return getDistanceToNow(new Date(value), now);
  }, [value, now]);

  const updateIntervalInSeconds = inArray(unit, ['second', 'minute', 'hour']) ? 1 : undefined;

  return (
    <Tooltip
      arrow
      forceDesktop={forceDesktop}
      placement="top"
      trigger={(triggerProps) => (
        <span {...triggerProps} {...props}>
          {children(
            <FormattedRelativeTime
              value={relativeTime}
              unit={unit}
              style={style}
              updateIntervalInSeconds={updateIntervalInSeconds}
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
                value={relativeTime}
                unit={unit}
                updateIntervalInSeconds={updateIntervalInSeconds}
              />
            }
          />

          <FormattedDateTime date={value} utc />
          <FormattedDateTime date={value} />
        </>
      }
    />
  );
}

type FormattedDateTimeProps = {
  date: string | Date;
  utc?: boolean;
};

function FormattedDateTime({ date, utc }: FormattedDateTimeProps) {
  return (
    <div className="row items-center gap-4">
      <div className="row items-center gap-1">
        <Badge size={1}>
          <Translate id="common.utc" values={{ offset: utc ? null : getUtcOffset() }} />
        </Badge>
        <FormattedDate value={date} timeZone={utc ? 'utc' : undefined} dateStyle="medium" />
      </div>

      <div className="ml-auto text-dim">
        <FormattedDate value={date} timeZone={utc ? 'utc' : undefined} timeStyle="medium" />
      </div>
    </div>
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
