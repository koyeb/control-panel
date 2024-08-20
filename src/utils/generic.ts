export function identity<T>(value: T): T {
  return value;
}

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}
