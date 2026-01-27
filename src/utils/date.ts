import { intervalToDuration } from 'date-fns';

export function createDate(value?: string): string {
  return (value ? new Date(value) : new Date()).toISOString();
}

export function removeTimezoneOffset(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

export function getUtcOffset(): string {
  const offsetMinutes = new Date().getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  const sign = offsetHours >= 0 ? '+' : '-';

  return `${sign}${Math.abs(offsetHours)}`;
}

export function formatSeconds(value: number) {
  // eslint-disable-next-line prefer-const
  let { years, months, weeks, days, hours, minutes, seconds } = intervalToDuration({
    start: 0,
    end: value * 1000,
  });

  days ??= 0;
  hours ??= 0;
  minutes ??= 0;
  seconds ??= 0;

  if (years !== undefined) {
    days += years * 365;
  }

  if (months !== undefined) {
    days += months * 30;
  }

  if (weeks !== undefined) {
    days += weeks * 7;
  }

  return { days, hours, minutes, seconds };
}
