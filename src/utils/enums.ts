import { inArray } from './arrays';

export function isEnumValue<T extends string>(enumType: Record<string, T>) {
  return (value: unknown): value is T => inArray(value, Object.values(enumType));
}

export function enumIndex<T extends string>(enumType: Record<string, T>) {
  return (value: T) => Object.values(enumType).indexOf(value);
}
