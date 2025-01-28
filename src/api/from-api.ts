import { snakeToCamelDeep } from 'src/utils/object';
import { RequiredDeep, SnakeToCamelCaseDeep } from 'src/utils/types';

export type FromApi<T> = SnakeToCamelCaseDeep<RequiredDeep<T>>;

export function fromApi<T>(obj: T): FromApi<T> {
  return snakeToCamelDeep(obj as RequiredDeep<T>);
}
