import { Badge, TooltipTitle } from '@koyeb/design-system';
import { addSeconds, differenceInSeconds } from 'date-fns';
import { FormattedDate } from 'react-intl';

import { Tooltip } from 'src/components/tooltip';
import { useNow } from 'src/hooks/timers';
import { Translate, TranslateFn, createTranslate, useTranslate } from 'src/intl/translate';
import { Service } from 'src/model';
import { formatSeconds, getUtcOffset } from 'src/utils/date';

import { TimeUnit } from './service-lifecycle-form';

const T = createTranslate('pages.service.settings.lifecycle.footer');

export function FooterInfo({ service }: { service: Service }) {
  const { deleteAfterCreate, deleteAfterSleep } = service.lifeCycle;

  const afterCreate = deleteAfterCreate !== undefined && (
    <AfterCreateBadge service={service} deleteAfterCreate={deleteAfterCreate} />
  );

  const afterSleep = deleteAfterSleep !== undefined && (
    <AfterSleepBadge deleteAfterSleep={deleteAfterSleep} />
  );

  const message = () => {
    if (afterCreate && !afterSleep) {
      return <T id="afterCreate" values={{ value: afterCreate }} />;
    }

    if (!afterCreate && afterSleep) {
      return <T id="afterSleep" values={{ value: afterSleep }} />;
    }

    if (afterCreate && afterSleep) {
      return <T id="both" values={{ afterCreate, afterSleep }} />;
    }

    return <T id="none" />;
  };

  return <p className="text-dim">{message()}</p>;
}

function AfterCreateBadge({ service, deleteAfterCreate }: { service: Service; deleteAfterCreate: number }) {
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
        <Badge {...props} size={1} color="blue" className="inline-block">
          {relativeTimeValue(t, roundSeconds(seconds))}
        </Badge>
      )}
    />
  );
}

function AfterSleepBadge({ deleteAfterSleep }: { deleteAfterSleep: number }) {
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
          <TooltipTitle title={<T id="afterCreateTooltip.title" />} />
          {relativeTime}
        </>
      }
      trigger={(props) => (
        <Badge {...props} size={1} color="blue" className="inline-block">
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

  return result.join(' ');
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
