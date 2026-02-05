import { Badge, BadgeColor, TooltipTitle } from '@koyeb/design-system';
import { RegisteredRouter } from '@tanstack/react-router';
import { addSeconds, differenceInSeconds } from 'date-fns';
import { FormattedDate } from 'react-intl';

import { Link, ValidateLinkOptions } from 'src/components/link';
import { Tooltip } from 'src/components/tooltip';
import { useNow } from 'src/hooks/timers';
import { IconClock } from 'src/icons';
import { Translate, TranslateFn, createTranslate, useTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { TimeUnit, formatSeconds, getUtcOffset } from 'src/utils/date';

const T = createTranslate('components.serviceLifecycle');

type ServiceLifecycleInfoProps<LinkOptions> = {
  service: Service;
  link?: ValidateLinkOptions<RegisteredRouter, LinkOptions>;
};

export function ServiceLifecycleInfo<LinkOptions = unknown>({
  service,
  link,
}: ServiceLifecycleInfoProps<LinkOptions>) {
  const { deleteAfterCreate, deleteAfterSleep } = service.lifeCycle;

  const afterCreate = deleteAfterCreate !== undefined && (
    <ServiceDeleteAfterCreateBadge service={service} deleteAfterCreate={deleteAfterCreate} />
  );

  const afterSleep = deleteAfterSleep !== undefined && (
    <ServiceDeleteAfterSleepBadge deleteAfterSleep={deleteAfterSleep} />
  );

  const message = () => {
    if (afterCreate && afterSleep) {
      return <T id="both" values={{ afterCreate, afterSleep }} />;
    }

    if (afterCreate) {
      return <T id="afterCreate" values={{ afterCreate }} />;
    }

    if (afterSleep) {
      return <T id="afterSleep" values={{ afterSleep }} />;
    }
  };

  if (!afterCreate && !afterSleep) {
    return null;
  }

  return (
    <div className="col justify-between gap-2 rounded-md bg-muted/50 p-3 @sm:row @sm:items-center @sm:gap-4">
      <div className="row items-center gap-2">
        <div>
          <IconClock className="size-4 text-dim" />
        </div>

        <p className="row items-center gap-1">{message()}</p>
      </div>

      {link && (
        <Link className="text-link" {...link}>
          <T id="update" />
        </Link>
      )}
    </div>
  );
}

type ServiceDeleteAfterCreateBadgeProps = {
  color?: BadgeColor;
  service: Service;
  deleteAfterCreate: number;
};

export function ServiceDeleteAfterCreateBadge({
  color,
  service,
  deleteAfterCreate,
}: ServiceDeleteAfterCreateBadgeProps) {
  const t = useTranslate();
  const now = useNow();

  const date = addSeconds(service.createdAt, deleteAfterCreate);
  const seconds = differenceInSeconds(addSeconds(new Date(service.createdAt), deleteAfterCreate), now);

  const relativeTime = (
    <div className="row items-center justify-between gap-4">
      <div className="text-sm">
        <T id="afterCreateTooltip.relativeTime" values={{ value: relativeTimeValue(t, seconds) }} />
      </div>

      <div className="text-end text-xs text-dim">
        <T id="afterCreateTooltip.relativeTimeSeconds" values={{ seconds }} />
      </div>
    </div>
  );

  const timeZoneBadge = (
    <Badge size={1}>
      <Translate id="common.utc" values={{ offset: getUtcOffset() }} />
    </Badge>
  );

  const absoluteDate = (
    <div className="row items-center justify-between gap-4">
      <div className="text-sm">
        <T
          id="afterCreateTooltip.date"
          values={{ badge: timeZoneBadge, date: <FormattedDate value={date} dateStyle="long" /> }}
        />
      </div>

      <div className="text-end text-xs text-dim">
        <FormattedDate value={date} timeStyle="medium" />
      </div>
    </div>
  );

  return (
    <Tooltip
      className="col gap-3"
      content={
        <>
          <TooltipTitle title={<T id="afterCreateTooltip.title" />} />
          {relativeTime}
          {absoluteDate}
        </>
      }
      trigger={(props) => (
        <Badge {...props} size={1} color={color}>
          {relativeTimeValue(t, roundSeconds(seconds))}
        </Badge>
      )}
    />
  );
}

type ServiceDeleteAfterSleepProps = {
  color?: BadgeColor;
  deleteAfterSleep: number;
};

export function ServiceDeleteAfterSleepBadge({ color, deleteAfterSleep }: ServiceDeleteAfterSleepProps) {
  const t = useTranslate();

  const relativeTime = (
    <div className="row items-center justify-between gap-4">
      <div className="text-sm">
        <T id="afterSleepTooltip.relativeTime" values={{ value: relativeTimeValue(t, deleteAfterSleep) }} />
      </div>

      <div className="text-end text-xs text-dim">
        <T id="afterSleepTooltip.relativeTimeSeconds" values={{ seconds: deleteAfterSleep }} />
      </div>
    </div>
  );

  return (
    <Tooltip
      className="col gap-3"
      content={
        <>
          <TooltipTitle title={<T id="afterSleepTooltip.title" />} />
          {relativeTime}
        </>
      }
      trigger={(props) => (
        <Badge {...props} size={1} color={color}>
          {relativeTimeValue(t, roundSeconds(deleteAfterSleep))}
        </Badge>
      )}
    />
  );
}

function relativeTimeValue(t: TranslateFn, seconds: number) {
  const values = formatSeconds(seconds);
  const result: string[] = [];

  if (seconds <= 0) {
    return formatTimeValue(t, 0, 'seconds');
  }

  for (const unit of ['days', 'hours', 'minutes', 'seconds'] satisfies TimeUnit[]) {
    if (values[unit]) {
      result.push(formatTimeValue(t, values[unit], unit));
    }
  }

  return result.join(' ').trim();
}

function formatTimeValue(t: TranslateFn, value: number, unit: TimeUnit) {
  return `${value}${t(`enums.timeUnit.${unit}`)[0]?.toLowerCase()} `;
}

function roundSeconds(seconds: number) {
  if (seconds > 60 * 60) {
    return Math.round(seconds / 60) * 60;
  }

  return seconds;
}
