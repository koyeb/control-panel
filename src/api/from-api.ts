import { Simplify } from 'type-fest';

import { identity } from 'src/utils/generic';
import { snakeToCamelDeep } from 'src/utils/object';
import { Extend, RequiredDeep, SnakeToCamelCaseDeep } from 'src/utils/types';

export type FromApi<T, U = unknown> = Simplify<SnakeToCamelCaseDeep<Extend<RequiredDeep<T>, U>>>;

export function fromApi<T>(obj: T): FromApi<T>;
export function fromApi<T, U>(obj: T, transform: (value: T) => U): FromApi<U>;

export function fromApi(obj: unknown, transform = identity) {
  return transform(snakeToCamelDeep(obj));
}
