export function lowerCase(str: undefined): undefined;
export function lowerCase<S extends string>(str: S): Lowercase<S>;
export function lowerCase(str?: string): string | undefined {
  return str?.toLowerCase();
}

export function upperCase(str: undefined): undefined;
export function upperCase<S extends string>(str: S): Uppercase<S>;
export function upperCase(str?: string): string | undefined {
  return str?.toUpperCase();
}

export function capitalize(str: undefined): undefined;
export function capitalize<S extends string>(str: S): Capitalize<S>;
export function capitalize(str?: string): string | undefined {
  if (str === undefined) return undefined;
  if (str === '') return '';

  const firstLetter = str[0] as string;
  const rest = str.slice(1);

  return `${upperCase(firstLetter)}${rest}`;
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
    .toLowerCase()
    .slice(0, 63)
    .replace(/(^-|-$)/g, '');
}

export function isSlug(value: string): boolean {
  return /^[-.a-z0-9]*$/.exec(value) !== null;
}

export function shortId(uuid: string | undefined): string | undefined;
export function shortId(uuid: string): string;
export function shortId(uuid?: string) {
  return uuid?.slice(0, 8);
}
