import { formatDuration, intervalToDuration } from 'date-fns';

export function createDate(value?: string): string {
  return (value ? new Date(value) : new Date()).toISOString();
}

export function removeTimezoneOffset(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}

export function formatSecondsDuration(seconds: number): string {
  return formatDuration(intervalToDuration({ start: 0, end: seconds * 1000 }));
}
