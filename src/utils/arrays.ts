import { identity } from './generic';

export function createArray<T>(length: number, init: T | ((index: number) => T)) {
  return Array(length)
    .fill(null)
    .map((_, index) => (init instanceof Function ? init(index) : init));
}

export function unique<T>(array: T[], iteratee: (value: T) => unknown = identity): T[] {
  return Array.from(new Map(array.map((value) => [iteratee(value), value])).values());
}

export function inArray<T>(value: unknown, array: readonly T[]): value is T {
  return array.includes(value as T);
}

export function last<T>(array: T[]): T | undefined {
  return array.at(array.length - 1);
}

export function exclude<T>(array: T[], ...elements: T[]): T[] {
  return array.filter((e) => !elements.includes(e));
}

export function isNotEmpty<T>(array: T[]): array is [T, ...T[]] {
  return array.length >= 1;
}

export function arrayToggle<T>(array: T[], element: T): T[] {
  return array.includes(element) ? array.filter((e) => e !== element) : [...array, element];
}
