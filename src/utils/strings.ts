import { assert } from './assert';

export function lowerCase<S extends string>(str: S): Lowercase<S> {
  return str.toLowerCase() as Lowercase<S>;
}

export function upperCase<S extends string>(str: S): Uppercase<S> {
  return str.toUpperCase() as Uppercase<S>;
}

export function capitalize<S extends string>(str: S): Capitalize<S> {
  if (str === '') {
    return '' as Capitalize<S>;
  }

  const firstLetter = str[0];
  const rest = str.slice(1);

  assert(firstLetter !== undefined);

  return `${upperCase(firstLetter)}${rest}` as Capitalize<S>;
}

export function removePrefix<S extends string, Prefix extends string>(
  prefix: Prefix,
  str: S,
): S extends `${Prefix}${infer Suffix}` ? Suffix : S {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  return str.replace(new RegExp(`^${prefix}`), '') as any;
}

export function createId(): string {
  return Math.random().toString(36).slice(-6);
}

export function slugify(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/--+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
    .slice(0, 63);
}

export function isSlug(value: string): boolean {
  return /^[-.a-z0-9]*$/.exec(value) !== null;
}

export function shortId(uuid: string | undefined): string | undefined;
export function shortId(uuid: string): string;
export function shortId(uuid?: string) {
  return uuid?.slice(0, 8);
}
