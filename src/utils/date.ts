export function createDate(value?: string): string {
  return (value ? new Date(value) : new Date()).toISOString();
}

export function removeTimezoneOffset(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

export function formatDateInTimeZones(date: Date) {
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;
  const sign = offsetHours >= 0 ? '+' : '-';
  const utcOffset = `${sign}${Math.abs(offsetHours)}`;

  return {
    utcOffset,
    utc: (opts?: Intl.DateTimeFormatOptions) => {
      return date.toLocaleString('en-US', { timeZone: 'UTC', ...opts });
    },
    local: (opts?: Intl.DateTimeFormatOptions) => {
      return date.toLocaleString(undefined, {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ...opts,
      });
    },
  };
}
