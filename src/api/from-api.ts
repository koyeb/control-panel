import { Simplify } from 'type-fest';

import { identity } from 'src/utils/generic';
import { snakeToCamelDeep } from 'src/utils/object';
import { Extend, RequiredDeep, SnakeToCamelCaseDeep } from 'src/utils/types';

export type FromApi<T, NullableFields extends keyof T = never> = Simplify<
  SnakeToCamelCaseDeep<Extend<RequiredDeep<T>, { [K in NullableFields]-?: T[K] | null }>>
>;

export function fromApi<T>(obj: T): FromApi<T>;
export function fromApi<T, U>(obj: T, transform: (value: T) => U): FromApi<U>;

export function fromApi(obj: unknown, transform = identity) {
  return transform(snakeToCamelDeep(obj));
}
