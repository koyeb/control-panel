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

}
