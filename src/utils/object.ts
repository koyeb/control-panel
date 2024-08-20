export function hasProperty<T, K extends keyof T>(property: K, value: T[K] | null | undefined) {
  return (obj: T) => obj[property] === value;
}

function getter<P extends PropertyKey>(property: P) {
  return <T extends { [key in P]: V }, V>(obj: T): V => obj[property];
}

export const getId = getter('id');
export const getName = getter('name');

export function keys<K extends PropertyKey>(obj: Record<K, unknown>) {
  return Object.keys(obj) as K[];
}

export function entries<T extends object>(obj: T) {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

export function toObject<T, K extends PropertyKey, V>(
  array: readonly T[],
  getKey: (item: T, index: number) => K,
  getValue: (item: T, index: number) => V,
): Record<K, V> {
  return array.reduce(
    (obj, item, index) => ({
      ...obj,
      [getKey(item, index)]: getValue(item, index),
    }),
    {} as Record<K, V>,
  );
}
