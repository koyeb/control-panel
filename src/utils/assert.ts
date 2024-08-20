export class AssertionError extends Error {
  constructor(
    message = 'Assertion failed',
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export function assert(condition: boolean, error?: AssertionError): asserts condition {
  if (!condition) {
    throw error ?? new AssertionError();
  }
}

export function defined<T>(value: T | null | undefined, error?: AssertionError): T {
  assert(value !== null && value !== undefined, error);
  return value;
}
