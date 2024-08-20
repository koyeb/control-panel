export function createDate(value?: string): string {
  return (value ? new Date(value) : new Date()).toISOString();
}

export function removeTimezoneOffset(date: Date): Date {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
}
